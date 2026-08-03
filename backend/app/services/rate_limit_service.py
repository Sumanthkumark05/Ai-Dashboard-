import time
from typing import Tuple
from loguru import logger
import redis.asyncio as aioredis

from app.core.config import settings


class RateLimitService:
    """
    Distributed Rate Limiting Service using Redis sliding window log.
    """

    LIMIT_RULES = {
        "/api/v1/auth": (5, 60),          # 5 requests per 60 seconds
        "/api/v1/uploads": (20, 60),      # 20 requests per 60 seconds
        "/api/v1/files": (30, 60),        # 30 requests per 60 seconds
        "/api/v1/jobs": (30, 60),         # 30 requests per 60 seconds
        "default": (120, 60),             # 120 requests per 60 seconds
    }

    def __init__(self) -> None:
        self.redis_url = getattr(settings, "REDIS_URL", "redis://localhost:6379/0")
        self._client: aioredis.Redis = None

    async def _get_client(self) -> aioredis.Redis:
        if self._client is None:
            self._client = aioredis.from_url(
                self.redis_url, decode_responses=True, socket_timeout=1.0
            )
        return self._client

    async def is_rate_limited(self, identifier: str, path: str) -> Tuple[bool, int]:
        """
        Evaluates sliding window rate limit for identifier & path.
        Returns tuple: (is_limited: bool, retry_after_seconds: int)
        """
        # Determine limit rules
        max_requests, window_seconds = self.LIMIT_RULES.get("default")
        for prefix, rule in self.LIMIT_RULES.items():
            if prefix != "default" and path.startswith(prefix):
                max_requests, window_seconds = rule
                break

        key = f"rate_limit:{identifier}:{path}"
        now = time.time()
        clear_before = now - window_seconds

        try:
            client = await self._get_client()
            pipe = client.pipeline()
            pipe.zremrangebyscore(key, 0, clear_before)
            pipe.zcard(key)
            pipe.zadd(key, {str(now): now})
            pipe.expire(key, window_seconds)
            results = await pipe.execute()

            request_count = results[1]
            if request_count >= max_requests:
                logger.warning(f"Rate limit exceeded for '{identifier}' on path '{path}' ({request_count}/{max_requests})")
                return True, window_seconds

            return False, 0
        except Exception as e:
            logger.debug(f"Redis rate limiting fallback due to error: {e}")
            return False, 0


rate_limit_service = RateLimitService()
