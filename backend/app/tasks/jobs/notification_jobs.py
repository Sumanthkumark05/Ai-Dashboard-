from typing import Any, Dict
from loguru import logger
from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, name="app.tasks.jobs.notification_jobs.deliver_notification", max_retries=3)
def deliver_notification(self, job_id: str, user_id: str, message: str) -> Dict[str, Any]:
    """
    Asynchronous notification delivery task.
    """
    logger.info(f"[JOB {job_id}] Delivering notification to User ID '{user_id}': {message}")
    return {"status": "delivered", "user_id": user_id, "message": message}
