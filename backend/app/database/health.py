import time
from typing import Any, Dict
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, DBAPIError
from loguru import logger
from app.database.session import AsyncSessionLocal


async def check_database() -> Dict[str, Any]:
    """
    Executes health diagnostic on the database.
    Performs 'SELECT 1' query, measures latency, and retrieves engine version.
    """
    start_time = time.perf_counter()

    try:
        async with AsyncSessionLocal() as session:
            # 1. Execute heartbeat query
            result = await session.execute(text("SELECT 1"))
            result.scalar()

            latency_ms = (time.perf_counter() - start_time) * 1000

            # 2. Query database version safely
            db_version = "Unknown"
            try:
                version_result = await session.execute(text("SELECT version()"))
                version_str = version_result.scalar()
                if version_str:
                    db_version = version_str.split()[0]
            except Exception:
                db_version = "SQL Engine"

            return {
                "status": "connected",
                "healthy": True,
                "latency_ms": round(latency_ms, 2),
                "version": db_version,
                "error": None,
            }

    except (OperationalError, DBAPIError, Exception) as exc:
        latency_ms = (time.perf_counter() - start_time) * 1000
        error_msg = f"Database health check failed: {type(exc).__name__}"
        logger.error(error_msg)

        return {
            "status": "disconnected",
            "healthy": False,
            "latency_ms": round(latency_ms, 2),
            "version": "Unavailable",
            "error": error_msg,
        }
