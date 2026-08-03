from typing import Any, Dict
from loguru import logger
from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, name="app.tasks.jobs.email_jobs.send_async_email", max_retries=3)
def send_async_email(self, job_id: str, recipient: str, subject: str, body: str) -> Dict[str, Any]:
    """
    Asynchronous email sending background task.
    """
    logger.info(f"[JOB {job_id}] Sending email to '{recipient}' (Subject: '{subject}')")
    return {"status": "sent", "recipient": recipient, "subject": subject}
