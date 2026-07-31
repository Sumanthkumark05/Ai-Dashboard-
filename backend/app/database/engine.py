from typing import Any, Dict
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.pool import NullPool, StaticPool
from loguru import logger
from app.core.config import settings


def create_db_engine() -> AsyncEngine:
    """
    Factory function initializing the production-ready SQLAlchemy 2.0 Async Engine.
    Configures connection pooling, recycle time, timeout, and pre-ping checks.
    """
    url = settings.ASYNC_DATABASE_URL or settings.DATABASE_URL
    is_sqlite = url.startswith("sqlite")

    engine_kwargs: Dict[str, Any] = {
        "echo": settings.DEBUG,
        "future": True,
    }

    if is_sqlite:
        if ":memory:" in url:
            engine_kwargs["poolclass"] = StaticPool
            engine_kwargs["connect_args"] = {"check_same_thread": False}
        else:
            engine_kwargs["poolclass"] = NullPool
    else:
        # Production PostgreSQL pooling configurations (AsyncAdaptedQueuePool used automatically)
        engine_kwargs.update(
            {
                "pool_size": 10,
                "max_overflow": 20,
                "pool_timeout": 30,
                "pool_recycle": 1800,  # Recycle connections after 30 minutes
                "pool_pre_ping": True,  # Test connection viability before handing out
            }
        )

    logger.info("Initializing SQLAlchemy Async Database Engine...")
    return create_async_engine(url, **engine_kwargs)



# Global Singleton Engine Instance
engine: AsyncEngine = create_db_engine()
