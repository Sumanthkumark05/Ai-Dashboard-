import asyncio
from loguru import logger
from app.schemas.events import WebSocketEventType, WebSocketMessage
from app.websocket.connection_manager import manager


class HeartbeatManager:
    """
    Heartbeat ping-pong service periodically checking client socket vitality.
    """

    def __init__(self, interval_seconds: int = 30) -> None:
        self.interval_seconds = interval_seconds
        self._task: asyncio.Task = None

    async def start(self) -> None:
        """
        Starts background heartbeat loop.
        """
        self._task = asyncio.create_task(self._loop())

    async def stop(self) -> None:
        """
        Stops background heartbeat loop.
        """
        if self._task:
            self._task.cancel()

    async def _loop(self) -> None:
        while True:
            try:
                await asyncio.sleep(self.interval_seconds)
                ping_msg = WebSocketMessage(
                    event=WebSocketEventType.HEARTBEAT_PING.value,
                    data={"ping": "keepalive"},
                )
                await manager.broadcast_all(ping_msg)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.warning(f"Heartbeat loop error: {e}")


heartbeat_manager = HeartbeatManager(interval_seconds=30)
