from typing import Any, Dict, Optional
from loguru import logger
from app.core.constants import JobPriority
from app.tasks.celery_app import celery_app


class QueueService:
    """
    Service managing task dispatch, Celery task revocation, and queue inspection.
    """

    PRIORITY_QUEUE_MAP = {
        JobPriority.CRITICAL: "critical",
        JobPriority.HIGH: "high",
        JobPriority.NORMAL: "normal",
        JobPriority.LOW: "low",
    }

    TASK_NAME_MAP = {
        "process_ai_document": "app.tasks.jobs.ai_jobs.process_ai_document",
        "summarize_chat": "app.tasks.jobs.ai_jobs.summarize_chat",
        "preprocess_dataset": "app.tasks.jobs.dataset_jobs.preprocess_dataset",
        "parse_pdf_ocr": "app.tasks.jobs.document_jobs.parse_pdf_ocr",
        "send_async_email": "app.tasks.jobs.email_jobs.send_async_email",
        "calculate_storage_statistics": "app.tasks.jobs.storage_jobs.calculate_storage_statistics",
        "cleanup_temporary_files": "app.tasks.jobs.cleanup_jobs.cleanup_temporary_files",
        "cleanup_expired_invitations": "app.tasks.jobs.cleanup_jobs.cleanup_expired_invitations",
        "aggregate_hourly_analytics": "app.tasks.jobs.analytics_jobs.aggregate_hourly_analytics",
        "deliver_notification": "app.tasks.jobs.notification_jobs.deliver_notification",
    }

    @classmethod
    def get_queue_name(cls, priority: JobPriority) -> str:
        return cls.PRIORITY_QUEUE_MAP.get(priority, "normal")

    @classmethod
    def dispatch_task(
        cls, job_id: str, job_name: str, priority: JobPriority, task_kwargs: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Dispatches an asynchronous Celery task to the broker.
        """
        queue_name = cls.get_queue_name(priority)
        full_task_name = cls.TASK_NAME_MAP.get(job_name, f"app.tasks.jobs.{job_name}")

        kwargs = task_kwargs or {}
        kwargs["job_id"] = str(job_id)

        try:
            async_result = celery_app.send_task(
                full_task_name,
                kwargs=kwargs,
                queue=queue_name,
                retry=False,
            )
            task_id = async_result.id
            logger.info(f"Task '{full_task_name}' dispatched to queue '{queue_name}' with Celery Task ID '{task_id}'")
            return task_id
        except Exception as e:
            logger.warning(f"Celery broker unavailable ({e}). Task recorded with fallback Task ID.")
            return f"task_{job_id[:8]}"


    @classmethod
    def revoke_task(cls, task_id: str) -> None:
        """
        Revokes a pending or running Celery task.
        """
        if task_id:
            try:
                celery_app.control.revoke(task_id, terminate=True)
                logger.info(f"Celery Task ID '{task_id}' revoked successfully.")
            except Exception as e:
                logger.warning(f"Could not revoke Celery Task ID '{task_id}': {e}")
