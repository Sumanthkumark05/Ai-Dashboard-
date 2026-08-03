from typing import AsyncGenerator
from app.websocket.handlers.chat_handler import ChatHandler


class ChatStreamService:
    """
    Service coordinating AI chat token streaming over WebSocket channels.
    """

    @staticmethod
    async def stream_ai_chat(
        room_id: str, chat_id: str, prompt: str, content_generator: AsyncGenerator[str, None]
    ) -> None:
        """
        Delegates AI response token streaming to ChatHandler.
        """
        await ChatHandler.stream_chat_response(
            room_id=room_id, chat_id=chat_id, prompt=prompt, content_generator=content_generator
        )
