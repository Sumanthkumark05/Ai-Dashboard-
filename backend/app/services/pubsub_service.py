import json
from typing import Any, Dict, Optional
from loguru import logger
import redis.asyncio as aioredis

from app.core.config import settings
from app.schemas.events import WebSocketMessage


class PubSubService:
    """
    Redis Pub/Sub service enabling cross-instance event broadcasting for horizontal scaling.
    """

    CHANNEL_NAME = "neurodesk_events"

    def __init__(self) -> None:
        self.redis_url = getattr(settings, "REDIS_URL", "redis://localhost:6379/0")
        self._redis_client: Optional[aioredis.Redis] = None

    async def get_client(self) -> Optional[aioredis.Redis]:
        """
        Lazily initializes async Redis client connection.
        """
        if self._redis_client is None:
            try:
                self._redis_client = aioredis.from_url(
                    self.redis_url, decode_responses=True, socket_timeout=2.0
                )
            except Exception as e:
                logger.warning(f"Could not connect to Redis Pub/Sub: {e}")
                return None
        return self._redis_client

    async def publish(self, message: WebSocketMessage, channel_id: str = "global") -> bool:
        """
        Publishes a WebSocket message to Redis channel for multi-instance distribution.
        """
        client = await self.get_client()
        if not client:
            return False

        try:
            payload = {
                "channel_id": channel_id,
                "message": message.model_dump(),
            }
            await client.publish(self.CHANNEL_NAME, json.dumps(payload))
            logger.debug(f"Published event '{message.event}' to Redis channel '{channel_id}'")
            return True
        except Exception as e:
            logger.warning(f"Redis Pub/Sub publish failed: {e}")
            return False


pubsub_service = PubSubService()
