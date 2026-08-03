import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, GUID, TimestampMixin, UUIDMixin


class Conversation(Base, UUIDMixin, TimestampMixin):
    """
    SQLAlchemy ORM Model representing an AI Chat Conversation session.
    """

    __tablename__ = "conversations"

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="New Session",
        doc="Human-readable title of the conversation session",
    )
    model: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="openai/gpt-oss-120b",
        doc="Active AI model identifier used for this conversation",
    )
    is_pinned: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        doc="Flag indicating if conversation is pinned to sidebar top",
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        index=True,
        doc="User ID owning the conversation session",
    )

    # Relationships
    messages: Mapped[List["ChatMessage"]] = relationship(
        "ChatMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at",
    )

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "title": self.title,
            "model": self.model,
            "is_pinned": self.is_pinned,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "message_count": len(self.messages) if self.messages else 0,
        }


class ChatMessage(Base, UUIDMixin, TimestampMixin):
    """
    SQLAlchemy ORM Model representing an individual message in a chat conversation.
    """

    __tablename__ = "chat_messages"

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Foreign Key linking to parent conversation",
    )
    role: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        doc="Role of the message sender: system, user, or assistant",
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        doc="Full textual message content or markdown output",
    )
    model: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        doc="Model used to generate this specific message",
    )
    prompt_tokens: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        doc="Number of input prompt tokens used",
    )
    completion_tokens: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        doc="Number of output completion tokens generated",
    )
    total_tokens: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        doc="Total tokens consumed by message",
    )
    latency_ms: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        doc="Latency in milliseconds for model execution",
    )

    # Relationships
    conversation: Mapped["Conversation"] = relationship(
        "Conversation", back_populates="messages"
    )

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "conversation_id": str(self.conversation_id),
            "role": self.role,
            "content": self.content,
            "model": self.model,
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
            "latency_ms": self.latency_ms,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
