import json
from typing import Any, Optional
from loguru import logger
import redis.asyncio as aioredis

from app.core.config import settings


class CacheService:
    """
    Redis Response & Application State Caching Service.
    """

    def __init__(self) -> None:
        self.redis_url = getattr(settings, "REDIS_URL", "redis://localhost:6379/0")
        self._client: Optional[aioredis.Redis] = None

    async def _get_client(self) -> Optional[aioredis.Redis]:
        if self._client is None:
            try:
                self._client = aioredis.from_url(
                    self.redis_url, decode_responses=True, socket_timeout=1.0
                )
            except Exception as e:
                logger.warning(f"Could not initialize Redis Cache Service: {e}")
                return None
        return self._client

    async def get(self, key: str) -> Optional[Any]:
        """
        Retrieves cached JSON object by key.
        """
        client = await self._get_client()
        if not client:
            return None

        try:
            val = await client.get(key)
            return json.loads(val) if val else None
        except Exception as e:
            logger.debug(f"Cache GET error for key '{key}': {e}")
            return None

    async def set(self, key: str, value: Any, ttl_seconds: int = 300) -> bool:
        """
        Caches JSON serializable value with TTL.
        """
        client = await self._get_client()
        if not client:
            return False

        try:
            payload = json.dumps(value)
            await client.set(key, payload, ex=ttl_seconds)
            return True
        except Exception as e:
            logger.debug(f"Cache SET error for key '{key}': {e}")
            return False

    async def delete(self, key: str) -> bool:
        """
        Deletes cached key.
        """
        client = await self._get_client()
        if not client:
            return False

        try:
            await client.delete(key)
            return True
        except Exception:
            return False


cache_service = CacheService()
