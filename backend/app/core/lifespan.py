from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI
from loguru import logger
from app.core.config import settings
from app.core.logging import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Async lifespan context manager for managing application startup and shutdown lifecycle events.
    """
    # ==================== STARTUP LIFESPAN ====================
    setup_logging()

    app.state.debug = settings.DEBUG

    startup_banner = f"""
    ===============================================================
    🚀 {settings.APP_NAME} Backend Service Initialized
    ===============================================================
    • Version:      {settings.APP_VERSION}
    • Environment:  {settings.ENVIRONMENT}
    • Debug Mode:   {settings.DEBUG}
    • API Prefix:   {settings.API_PREFIX}
    • CORS Origin:  {settings.FRONTEND_URL}
    ===============================================================
    """
    # Ensure DB tables exist
    try:
        from app.database.engine import engine
        from app.database.base import Base
        import app.models  # load models
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema validated and synchronized.")
    except Exception as exc:
        logger.warning(f"Could not auto-create DB schema on startup: {exc}")

    yield

    # ==================== SHUTDOWN LIFESPAN ====================
    logger.info(f"🛑 Shutting down {settings.APP_NAME} Backend Service cleanly...")
