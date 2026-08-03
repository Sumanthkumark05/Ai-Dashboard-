import time
from typing import Any, Dict
from loguru import logger


class PerformanceService:
    """
    Performance Monitoring & Slow Query Logger.
    """

    SLOW_QUERY_THRESHOLD_MS = 500.0

    @classmethod
    def log_query_execution(cls, statement: str, duration_ms: float) -> None:
        """
        Logs SQL queries exceeding 500ms threshold.
        """
        if duration_ms >= cls.SLOW_QUERY_THRESHOLD_MS:
            logger.warning(
                f"[SLOW QUERY DETECTED] Duration: {duration_ms:.2f}ms | SQL: {statement[:200]}"
            )
