import os
from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

# Initialize Celery app instance
redis_url = getattr(settings, "REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "neurodesk_tasks",
    broker=redis_url,
    backend=redis_url,
    include=[
        "app.tasks.jobs.ai_jobs",
        "app.tasks.jobs.dataset_jobs",
        "app.tasks.jobs.document_jobs",
        "app.tasks.jobs.email_jobs",
        "app.tasks.jobs.storage_jobs",
        "app.tasks.jobs.cleanup_jobs",
        "app.tasks.jobs.analytics_jobs",
        "app.tasks.jobs.notification_jobs",
    ],
)

# Celery Configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_soft_time_limit=300,  # 5 minutes
    task_time_limit=600,       # 10 minutes
    broker_connection_retry_on_startup=False,
    broker_connection_max_retries=1,
    broker_connection_timeout=1.0,
    broker_transport_options={
        "max_retries": 1,
        "interval_start": 0,
        "interval_step": 0.2,
        "interval_max": 0.2,
        "socket_timeout": 1.0,
        "socket_connect_timeout": 1.0,
    },
    # Queue Routing Config
    task_routes={
        "app.tasks.jobs.ai_jobs.*": {"queue": "high"},
        "app.tasks.jobs.dataset_jobs.*": {"queue": "normal"},
        "app.tasks.jobs.document_jobs.*": {"queue": "high"},
        "app.tasks.jobs.email_jobs.*": {"queue": "low"},
        "app.tasks.jobs.storage_jobs.*": {"queue": "normal"},
        "app.tasks.jobs.cleanup_jobs.*": {"queue": "low"},
        "app.tasks.jobs.analytics_jobs.*": {"queue": "normal"},
        "app.tasks.jobs.notification_jobs.*": {"queue": "high"},
    },
    # Celery Beat Schedules
    beat_schedule={
        "cleanup-temp-files-daily": {
            "task": "app.tasks.jobs.cleanup_jobs.cleanup_temporary_files",
            "schedule": crontab(hour=2, minute=0),  # Every day at 2:00 AM UTC
        },
        "cleanup-expired-invitations-daily": {
            "task": "app.tasks.jobs.cleanup_jobs.cleanup_expired_invitations",
            "schedule": crontab(hour=3, minute=0),  # Every day at 3:00 AM UTC
        },
        "aggregate-analytics-hourly": {
            "task": "app.tasks.jobs.analytics_jobs.aggregate_hourly_analytics",
            "schedule": crontab(minute=0),  # Every hour
        },
        "storage-statistics-daily": {
            "task": "app.tasks.jobs.storage_jobs.calculate_storage_statistics",
            "schedule": crontab(hour=4, minute=0),  # Every day at 4:00 AM UTC
        },
    },
)
