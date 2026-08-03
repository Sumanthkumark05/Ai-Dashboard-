import asyncio
from typing import Any, AsyncGenerator, Dict
from app.schemas.events import WebSocketEventType, WebSocketMessage
from app.websocket.connection_manager import manager


class ChatHandler:
    """
    WebSocket event handler for AI Chat Streaming & Typing Indicators.
    """

    @staticmethod
    async def stream_chat_response(
        room_id: str, chat_id: str, prompt: str, content_generator: AsyncGenerator[str, None]
    ) -> None:
        """
        Streams AI token chunks incrementally over WebSocket room.
        """
        start_msg = WebSocketMessage(
            event=WebSocketEventType.CHAT_STARTED.value,
            room_id=room_id,
            data={"chat_id": chat_id, "prompt": prompt},
        )
        await manager.broadcast_to_room(start_msg, room_id)

        full_response = []
        try:
            async for chunk in content_generator:
                full_response.append(chunk)
                chunk_msg = WebSocketMessage(
                    event=WebSocketEventType.CHAT_CHUNK.value,
                    room_id=room_id,
                    data={"chat_id": chat_id, "chunk": chunk},
                )
                await manager.broadcast_to_room(chunk_msg, room_id)
                await asyncio.sleep(0.05)  # Smooth token streaming delay

            completed_msg = WebSocketMessage(
                event=WebSocketEventType.CHAT_COMPLETED.value,
                room_id=room_id,
                data={"chat_id": chat_id, "full_text": "".join(full_response)},
            )
            await manager.broadcast_to_room(completed_msg, room_id)

        except Exception as e:
            error_msg = WebSocketMessage(
                event=WebSocketEventType.CHAT_ERROR.value,
                room_id=room_id,
                data={"chat_id": chat_id, "error": str(e)},
            )
            await manager.broadcast_to_room(error_msg, room_id)

    @staticmethod
    async def send_typing_indicator(room_id: str, username: str, is_typing: bool) -> None:
        """
        Broadcasts typing indicator status to chat room.
        """
        msg = WebSocketMessage(
            event=WebSocketEventType.CHAT_TYPING.value,
            room_id=room_id,
            data={"username": username, "is_typing": is_typing},
        )
        await manager.broadcast_to_room(msg, room_id)
