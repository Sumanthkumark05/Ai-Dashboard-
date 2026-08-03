from typing import List, Optional
from pydantic import BaseModel, Field


class TokenUsage(BaseModel):
    prompt_tokens: int = Field(default=0, description="Number of prompt tokens")
    completion_tokens: int = Field(default=0, description="Number of completion tokens")
    total_tokens: int = Field(default=0, description="Total tokens consumed")


class ChatRequest(BaseModel):
    conversation_id: Optional[str] = Field(
        default=None, description="Optional conversation ID to append message to"
    )
    message: str = Field(..., min_length=1, description="User prompt text")
    model: str = Field(
        default="openai/gpt-oss-120b",
        description="AI model requested for completion",
    )
    system_prompt: Optional[str] = Field(
        default=None, description="Optional custom system prompt instruction"
    )


class ChatResponse(BaseModel):
    conversation_id: str = Field(..., description="Active conversation session ID")
    assistant_message: str = Field(..., description="Generated assistant message content")
    usage: TokenUsage = Field(
        default_factory=TokenUsage, description="Token usage details"
    )


class MessageSchema(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    model: Optional[str] = None
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    latency_ms: int = 0
    created_at: Optional[str] = None


class ConversationSchema(BaseModel):
    id: str
    title: str
    model: str
    is_pinned: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    message_count: int = 0


class ConversationDetailSchema(ConversationSchema):
    messages: List[MessageSchema] = []


class ConversationUpdateSchema(BaseModel):
    title: Optional[str] = Field(default=None, max_length=255)
    is_pinned: Optional[bool] = None
