from typing import Any, Dict
from app.tasks.celery_app import celery_app


class SchedulerService:
    """
    Service reporting Celery Beat recurring schedule definitions.
    """

    @staticmethod
    def get_scheduled_tasks() -> Dict[str, Any]:
        """
        Returns registered Celery Beat schedules.
        """
        schedules = celery_app.conf.beat_schedule or {}
        items = []
        for name, cfg in schedules.items():
            items.append({
                "name": name,
                "task": cfg.get("task"),
                "schedule": str(cfg.get("schedule")),
            })
        return {"scheduled_tasks": items, "total_count": len(items)}
