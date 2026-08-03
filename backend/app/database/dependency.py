from typing import AsyncGenerator
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from loguru import logger
from app.database.session import AsyncSessionLocal


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI Dependency yielding an AsyncSession for HTTP request lifecycles.
    Manages session lifecycle, transaction rollbacks on failure, and clean closing.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except HTTPException:
            # Re-raise HTTP exceptions directly without wrapping
            await session.rollback()
            raise
        except SQLAlchemyError as exc:
            await session.rollback()
            logger.exception(f"SQLAlchemy Database Error during request: {type(exc).__name__}: {exc}")
            
            exc_str = str(exc).lower()
            if "connection refused" in exc_str or "connect call failed" in exc_str:
                detail = "Database connection failed. PostgreSQL is not reachable."
            elif "password authentication failed" in exc_str:
                detail = "Database authentication failed. Please check database credentials."
            elif "database" in exc_str and "does not exist" in exc_str:
                detail = "Database does not exist. Please run Alembic migrations."
            else:
                detail = "A database operation error occurred. Please check server logs."
                
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=detail,
            )
        except Exception as exc:
            await session.rollback()
            logger.exception(f"Unhandled Exception during DB session: {type(exc).__name__}: {exc}")
            raise
