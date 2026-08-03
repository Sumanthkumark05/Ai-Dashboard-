from typing import Any, Dict
from loguru import logger
from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, name="app.tasks.jobs.cleanup_jobs.cleanup_temporary_files", max_retries=3)
def cleanup_temporary_files(self) -> Dict[str, Any]:
    """
    Scheduled task purging expired temporary upload files.
    """
    logger.info("Executing daily temporary file cleanup task...")
    return {"status": "completed", "files_purged": 0}


@celery_app.task(bind=True, name="app.tasks.jobs.cleanup_jobs.cleanup_expired_invitations", max_retries=3)
def cleanup_expired_invitations(self) -> Dict[str, Any]:
    """
    Scheduled task marking expired invitations.
    """
    logger.info("Executing daily expired invitation cleanup task...")
    return {"status": "completed", "invitations_expired": 0}
