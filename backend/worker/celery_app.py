import os
from celery import Celery
from celery.schedules import crontab

# Create Celery app
app = Celery(
    'rival_recon_worker',
    broker=os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    include=['worker.tasks', 'worker.recurring_scheduler']
)

# Configure Celery
app.conf.update(
    result_backend=os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0'),
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

# Configure scheduled tasks with Celery Beat
app.conf.beat_schedule = {
    'process-pending-submissions': {
        'task': 'process_pending_submissions',
        'schedule': 60.0,  # Every minute
    },
    'run-midnight-scheduler': {
        'task': 'run_midnight_scheduler',
        'schedule': crontab(minute=0, hour=0),  # Every day at midnight
    },
    'process-pending-refreshes': {
        'task': 'process_pending_refreshes',
        'schedule': 60.0,  # Every minute
    }
}

if __name__ == '__main__':
    app.start() 