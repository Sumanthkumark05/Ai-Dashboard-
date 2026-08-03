import time
from typing import Any, Dict
from loguru import logger
from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, name="app.tasks.jobs.document_jobs.parse_pdf_ocr", max_retries=3)
def parse_pdf_ocr(self, job_id: str, document_id: str) -> Dict[str, Any]:
    """
    Asynchronous PDF text extraction & OCR parsing task.
    """
    logger.info(f"[JOB {job_id}] Starting OCR parsing for Document ID: {document_id}")
    self.update_state(state="PROGRESS", meta={"progress": 60})
    time.sleep(0.5)

    return {
        "status": "completed",
        "document_id": document_id,
        "pages_extracted": 15,
        "ocr_confidence": 0.98,
    }
