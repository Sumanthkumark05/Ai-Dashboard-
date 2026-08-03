from app.tasks.celery_app import celery_app

if __name__ == "__main__":
    celery_app.worker_main(["worker", "--loglevel=info", "-Q", "critical,high,normal,low,dead_letter"])
