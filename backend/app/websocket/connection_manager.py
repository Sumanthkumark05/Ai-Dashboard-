import uuid
from typing import Dict, List, Set
from fastapi import WebSocket
from loguru import logger

from app.schemas.events import WebSocketMessage


class ConnectionManager:
    """
    Centralized Connection Manager tracking active WebSocket connections, multi-device sockets per user,
    and room/workspace/team subscriptions.
    """

    def __init__(self) -> None:
        # Maps user_id -> Set[WebSocket] (multi-device support)
        self.active_connections: Dict[uuid.UUID, Set[WebSocket]] = {}
        # Maps room_id -> Set[WebSocket]
        self.rooms: Dict[str, Set[WebSocket]] = {}
        # Global stats tracking
        self.total_messages_processed: int = 0

    async def connect(self, websocket: WebSocket, user_id: uuid.UUID, room_id: str = "global") -> None:
        """
        Accepts WebSocket connection and registers socket under user_id and room_id.
        """
        await websocket.accept()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        self.rooms[room_id].add(websocket)

        logger.info(f"WebSocket connected: User ID '{user_id}' registered in room '{room_id}'")

    def disconnect(self, websocket: WebSocket, user_id: uuid.UUID, room_id: str = "global") -> None:
        """
        Removes socket from active connections and rooms.
        """
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

        if room_id in self.rooms:
            self.rooms[room_id].discard(websocket)
            if not self.rooms[room_id]:
                del self.rooms[room_id]

        logger.info(f"WebSocket disconnected: User ID '{user_id}' removed from room '{room_id}'")

    async def send_personal_message(self, message: WebSocketMessage, user_id: uuid.UUID) -> None:
        """
        Sends WebSocket message to all active devices of a specific user.
        """
        sockets = self.active_connections.get(user_id, set())
        if not sockets:
            return

        payload_json = message.model_dump_json()
        dead_sockets: List[WebSocket] = []

        for socket in list(sockets):
            try:
                await socket.send_text(payload_json)
                self.total_messages_processed += 1
            except Exception as e:
                logger.warning(f"Error sending message to user '{user_id}': {e}")
                dead_sockets.append(socket)

        for ds in dead_sockets:
            self.disconnect(ds, user_id)

    async def broadcast_to_room(self, message: WebSocketMessage, room_id: str) -> None:
        """
        Broadcasts message to all sockets registered in a room/channel.
        """
        sockets = self.rooms.get(room_id, set())
        if not sockets:
            return

        payload_json = message.model_dump_json()
        dead_sockets: List[WebSocket] = []

        for socket in list(sockets):
            try:
                await socket.send_text(payload_json)
                self.total_messages_processed += 1
            except Exception as e:
                logger.warning(f"Error broadcasting message in room '{room_id}': {e}")
                dead_sockets.append(socket)

        for ds in dead_sockets:
            # Sockets will be cleaned up
            sockets.discard(ds)

    async def broadcast_all(self, message: WebSocketMessage) -> None:
        """
        Broadcasts message globally to all connected users.
        """
        payload_json = message.model_dump_json()
        for sockets in self.active_connections.values():
            for socket in list(sockets):
                try:
                    await socket.send_text(payload_json)
                    self.total_messages_processed += 1
                except Exception:
                    pass

    def get_stats(self) -> Dict[str, int]:
        """
        Returns connection statistics.
        """
        total_sockets = sum(len(sockets) for sockets in self.active_connections.values())
        return {
            "connected_users_count": len(self.active_connections),
            "active_connections_count": total_sockets,
            "active_rooms_count": len(self.rooms),
            "messages_processed": self.total_messages_processed,
        }


# Global ConnectionManager singleton instance
manager = ConnectionManager()
