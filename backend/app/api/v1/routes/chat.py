import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.database.dependency import get_db
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationDetailSchema,
    ConversationSchema,
    ConversationUpdateSchema,
    TokenUsage,
)
from app.services.ai_service import GroqAIService, HTTPException_Friendly
from app.services.conversation_service import ConversationService

router = APIRouter(prefix="/chat", tags=["AI Chat"])


@router.post(
    "",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute Non-Streaming AI Chat Completion",
    description="Sends prompt to Groq API using model openai/gpt-oss-120b and returns completion with token usage.",
)
async def chat_completion(
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    """
    POST /api/v1/chat
    """
    model_name = payload.model or "openai/gpt-oss-120b"
    
    # 1. Get or create conversation session
    conv = await ConversationService.get_or_create_conversation(
        db=db,
        conversation_id=payload.conversation_id,
        model=model_name,
    )
    conv_id = str(conv.id)

    # 2. Load past message history for context
    history_conv = await ConversationService.get_conversation_with_messages(db, conv_id)
    formatted_messages = []
    if history_conv and history_conv.messages:
        for msg in history_conv.messages:
            formatted_messages.append({"role": msg.role, "content": msg.content})
    
    # Append current user prompt
    formatted_messages.append({"role": "user", "content": payload.message})

    # Save user message to database
    await ConversationService.add_message(
        db=db,
        conversation_id=conv_id,
        role="user",
        content=payload.message,
        model=model_name,
    )

    # 3. Call Groq AI Service
    try:
        result = await GroqAIService.generate_completion(
            messages=formatted_messages,
            model=model_name,
            system_prompt=payload.system_prompt,
        )
    except HTTPException_Friendly as err:
        raise HTTPException(status_code=err.status_code, detail=err.message)
    except Exception as exc:
        logger.error(f"Error executing Groq AI completion: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Service Error: {str(exc)}",
        )

    assistant_msg = result["assistant_message"]
    usage_dict = result["usage"]
    latency_ms = result.get("latency_ms", 0)

    # 4. Save assistant response to database
    await ConversationService.add_message(
        db=db,
        conversation_id=conv_id,
        role="assistant",
        content=assistant_msg,
        model=model_name,
        prompt_tokens=usage_dict.get("prompt_tokens", 0),
        completion_tokens=usage_dict.get("completion_tokens", 0),
        total_tokens=usage_dict.get("total_tokens", 0),
        latency_ms=latency_ms,
    )

    return ChatResponse(
        conversation_id=conv_id,
        assistant_message=assistant_msg,
        usage=TokenUsage(
            prompt_tokens=usage_dict.get("prompt_tokens", 0),
            completion_tokens=usage_dict.get("completion_tokens", 0),
            total_tokens=usage_dict.get("total_tokens", 0),
        ),
    )


@router.post(
    "/stream",
    summary="Execute Real-Time Streaming AI Chat Completion (SSE)",
    description="Streams progressive output tokens from Groq API via Server-Sent Events.",
)
async def chat_stream(
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    POST /api/v1/chat/stream
    """
    model_name = payload.model or "openai/gpt-oss-120b"

    # 1. Get or create conversation session
    conv = await ConversationService.get_or_create_conversation(
        db=db,
        conversation_id=payload.conversation_id,
        model=model_name,
    )
    conv_id = str(conv.id)

    # 2. Load context history
    history_conv = await ConversationService.get_conversation_with_messages(db, conv_id)
    formatted_messages = []
    if history_conv and history_conv.messages:
        for msg in history_conv.messages:
            formatted_messages.append({"role": msg.role, "content": msg.content})

    formatted_messages.append({"role": "user", "content": payload.message})

    # Save user prompt
    await ConversationService.add_message(
        db=db,
        conversation_id=conv_id,
        role="user",
        content=payload.message,
        model=model_name,
    )

    async def event_generator():
        # First send initial metadata event with conversation_id
        yield f"data: {json.dumps({'type': 'init', 'conversation_id': conv_id})}\n\n"

        full_assistant_content = ""
        usage_data = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

        try:
            async for chunk in GroqAIService.stream_completion(
                messages=formatted_messages,
                model=model_name,
                system_prompt=payload.system_prompt,
            ):
                chunk_type = chunk.get("type")

                if chunk_type == "content":
                    text_delta = chunk.get("content", "")
                    full_assistant_content += text_delta
                    yield f"data: {json.dumps({'type': 'token', 'content': text_delta})}\n\n"

                elif chunk_type == "usage":
                    usage_data = chunk.get("usage", usage_data)
                    yield f"data: {json.dumps({'type': 'usage', 'usage': usage_data})}\n\n"

                elif chunk_type == "error":
                    err_msg = chunk.get("message", "Streaming error occurred.")
                    yield f"data: {json.dumps({'type': 'error', 'message': err_msg})}\n\n"
                    return

                elif chunk_type == "done":
                    break

        except Exception as exc:
            logger.error(f"Error during SSE streaming: {exc}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"
            return

        # Save accumulated assistant message to DB
        if full_assistant_content.strip():
            await ConversationService.add_message(
                db=db,
                conversation_id=conv_id,
                role="assistant",
                content=full_assistant_content,
                model=model_name,
                prompt_tokens=usage_data.get("prompt_tokens", 0),
                completion_tokens=usage_data.get("completion_tokens", 0),
                total_tokens=usage_data.get("total_tokens", 0),
            )

        yield f"data: {json.dumps({'type': 'done', 'conversation_id': conv_id, 'usage': usage_data})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get(
    "/conversations",
    response_model=List[ConversationSchema],
    summary="List All Conversations",
)
async def list_conversations(
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[ConversationSchema]:
    convs = await ConversationService.list_conversations(db=db, limit=limit)
    return [ConversationSchema(**c.to_dict()) for c in convs]


@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationDetailSchema,
    summary="Get Conversation Details and Message History",
)
async def get_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
) -> ConversationDetailSchema:
    conv = await ConversationService.get_conversation_with_messages(db, conversation_id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation session not found",
        )
    
    msgs = [m.to_dict() for m in conv.messages]
    conv_dict = conv.to_dict()
    conv_dict["messages"] = msgs
    return ConversationDetailSchema(**conv_dict)


@router.patch(
    "/conversations/{conversation_id}",
    response_model=ConversationSchema,
    summary="Update Conversation Metadata",
)
async def update_conversation(
    conversation_id: str,
    payload: ConversationUpdateSchema,
    db: AsyncSession = Depends(get_db),
) -> ConversationSchema:
    updated = await ConversationService.update_conversation(
        db=db,
        conversation_id=conversation_id,
        title=payload.title,
        is_pinned=payload.is_pinned,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return ConversationSchema(**updated.to_dict())


@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Conversation",
)
async def delete_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
):
    deleted = await ConversationService.delete_conversation(db=db, conversation_id=conversation_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
