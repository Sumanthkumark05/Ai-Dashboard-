from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
from app.database.session import AsyncSessionLocal


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI Dependency yielding an AsyncSession for HTTP request lifecycles.
    Automatically handles transaction rollback on exceptions and cleanup.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as exc:
            logger.error(f"Database session encountered exception, rolling back: {exc}")
            await session.rollback()
            raise
        finally:
            await session.close()
