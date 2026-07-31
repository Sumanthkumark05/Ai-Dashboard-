import logging
import sys
from pathlib import Path
from loguru import logger
from app.core.config import settings

# Define logs directory path
LOGS_DIR = Path(__file__).resolve().parent.parent.parent / "logs"


class InterceptHandler(logging.Handler):
    """
    Custom handler to intercept standard Python logging logs and redirect them to Loguru.
    """

    def emit(self, record: logging.LogRecord) -> None:
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame, depth = logging.currentframe(), 2
        while frame and frame.f_code.co_filename == logging.__file__:
            if frame.f_back:
                frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )


def setup_logging() -> None:
    """
    Centralized logging configuration using Loguru.
    Sets up console logging and daily rotating file logs.
    """
    # Ensure logs directory exists
    LOGS_DIR.mkdir(parents=True, exist_ok=True)

    # Remove default Loguru handler
    logger.remove()

    # Console Handler (Stdout)
    logger.add(
        sys.stdout,
        level=settings.LOG_LEVEL.upper(),
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
            "<level>{message}</level>"
        ),
        colorize=True,
        backtrace=settings.DEBUG,
        diagnose=settings.DEBUG,
    )

    # File Handler - Application Info & Debug Logs (Daily rotation)
    logger.add(
        LOGS_DIR / "app.log",
        level="INFO",
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}",
        rotation="00:00",
        retention="14 days",
        compression="zip",
        enqueue=True,
    )

    # File Handler - Error Logs Only
    logger.add(
        LOGS_DIR / "error.log",
        level="ERROR",
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}\n{exception}",
        rotation="10 MB",
        retention="30 days",
        compression="zip",
        enqueue=True,
        backtrace=True,
        diagnose=True,
    )

    # Intercept standard library loggers (e.g., Uvicorn, FastAPI, Asyncio)
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)

    for logger_name in ("uvicorn", "uvicorn.access", "uvicorn.error", "fastapi"):
        logging_logger = logging.getLogger(logger_name)
        logging_logger.handlers = [InterceptHandler()]
