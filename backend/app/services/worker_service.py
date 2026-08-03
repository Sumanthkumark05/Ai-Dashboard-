from typing import Any, Dict
from loguru import logger
from app.tasks.celery_app import celery_app


class WorkerService:
    """
    Service monitoring Celery worker health and active node statistics.
    """

    @staticmethod
    def get_worker_status() -> Dict[str, Any]:
        """
        Pings Celery workers and returns cluster status.
        """
        try:
            inspector = celery_app.control.inspect()
            active_workers = inspector.ping() or {}
            active_tasks = inspector.active() or {}
            reserved_tasks = inspector.reserved() or {}

            return {
                "active_workers_count": len(active_workers),
                "workers": list(active_workers.keys()),
                "active_tasks_count": sum(len(v) for v in active_tasks.values()),
                "reserved_tasks_count": sum(len(v) for v in reserved_tasks.values()),
                "status": "healthy" if active_workers else "no_active_workers",
            }
        except Exception as e:
            logger.warning(f"Failed to inspect Celery workers: {e}")
            return {
                "active_workers_count": 0,
                "workers": [],
                "active_tasks_count": 0,
                "reserved_tasks_count": 0,
                "status": "broker_unavailable",
            }
