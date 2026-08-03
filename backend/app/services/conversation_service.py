import uuid
from typing import List, Optional
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from loguru import logger

from app.models.chat import Conversation, ChatMessage


class ConversationService:
    """
    Service layer for persisting and retrieving Chat Conversations and Messages.
    """

    @staticmethod
    async def get_or_create_conversation(
        db: AsyncSession,
        conversation_id: Optional[str] = None,
        title: str = "New Session",
        model: str = "openai/gpt-oss-120b",
        user_id: Optional[str] = None,
    ) -> Conversation:
        """
        Retrieves existing conversation or creates a new one.
        """
        if conversation_id:
            try:
                conv_uuid = uuid.UUID(conversation_id)
                stmt = select(Conversation).where(Conversation.id == conv_uuid).options(selectinload(Conversation.messages))
                result = await db.execute(stmt)
                conv = result.scalar_one_or_none()
                if conv:
                    return conv
            except ValueError:
                pass

        # Create new conversation
        conv = Conversation(
            title=title,
            model=model,
            user_id=user_id,
        )
        db.add(conv)
        await db.commit()
        await db.refresh(conv)
        return conv

    @staticmethod
    async def list_conversations(
        db: AsyncSession, user_id: Optional[str] = None, limit: int = 50
    ) -> List[Conversation]:
        """
        Returns list of conversations sorted by updated_at descending.
        """
        stmt = (
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .order_by(Conversation.is_pinned.desc(), Conversation.updated_at.desc())
            .limit(limit)
        )
        if user_id:
            stmt = stmt.where(Conversation.user_id == user_id)

        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_conversation_with_messages(
        db: AsyncSession, conversation_id: str
    ) -> Optional[Conversation]:
        """
        Fetches conversation with all nested messages.
        """
        try:
            conv_uuid = uuid.UUID(conversation_id)
            stmt = select(Conversation).where(Conversation.id == conv_uuid).options(selectinload(Conversation.messages))
            result = await db.execute(stmt)
            return result.scalar_one_or_none()
        except ValueError:
            return None

    @staticmethod
    async def add_message(
        db: AsyncSession,
        conversation_id: str,
        role: str,
        content: str,
        model: Optional[str] = None,
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
        total_tokens: int = 0,
        latency_ms: int = 0,
    ) -> ChatMessage:
        """
        Adds a message to an existing conversation.
        Auto-generates title from first user prompt if title is 'New Session'.
        """
        conv_uuid = uuid.UUID(conversation_id)
        
        # Check if we should auto-title the conversation
        if role == "user":
            stmt = select(Conversation).where(Conversation.id == conv_uuid)
            result = await db.execute(stmt)
            conv = result.scalar_one_or_none()
            if conv and (conv.title == "New Session" or not conv.title):
                auto_title = content.strip()[:40] + ("..." if len(content.strip()) > 40 else "")
                conv.title = auto_title
                db.add(conv)

        msg = ChatMessage(
            conversation_id=conv_uuid,
            role=role,
            content=content,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            latency_ms=latency_ms,
        )
        db.add(msg)
        await db.commit()
        await db.refresh(msg)
        return msg

    @staticmethod
    async def update_conversation(
        db: AsyncSession,
        conversation_id: str,
        title: Optional[str] = None,
        is_pinned: Optional[bool] = None,
    ) -> Optional[Conversation]:
        """
        Updates conversation metadata (title, pin status).
        """
        try:
            conv_uuid = uuid.UUID(conversation_id)
            stmt = select(Conversation).where(Conversation.id == conv_uuid)
            result = await db.execute(stmt)
            conv = result.scalar_one_or_none()
            if not conv:
                return None

            if title is not None:
                conv.title = title
            if is_pinned is not None:
                conv.is_pinned = is_pinned

            await db.commit()
            await db.refresh(conv)
            return conv
        except ValueError:
            return None

    @staticmethod
    async def delete_conversation(db: AsyncSession, conversation_id: str) -> bool:
        """
        Deletes conversation and associated messages.
        """
        try:
            conv_uuid = uuid.UUID(conversation_id)
            stmt = select(Conversation).where(Conversation.id == conv_uuid)
            result = await db.execute(stmt)
            conv = result.scalar_one_or_none()
            if not conv:
                return False

            await db.delete(conv)
            await db.commit()
            return True
        except ValueError:
            return False
