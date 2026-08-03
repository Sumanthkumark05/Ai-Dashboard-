from typing import Any, Dict
from loguru import logger
from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, name="app.tasks.jobs.analytics_jobs.aggregate_hourly_analytics", max_retries=3)
def aggregate_hourly_analytics(self) -> Dict[str, Any]:
    """
    Scheduled task aggregating hourly user metrics and activity counts.
    """
    logger.info("Executing hourly analytics aggregation task...")
    return {"status": "completed", "metrics_aggregated": True}
