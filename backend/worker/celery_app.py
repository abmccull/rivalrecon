import os
from dotenv import load_dotenv
import logging
from celery import Celery
from celery.schedules import crontab

# Load environment variables from the project root directory (.env)
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
    logging.info(f".env file loaded successfully from {dotenv_path}")
else:
    logging.warning(f".env file not found at {dotenv_path}. Relying on system environment variables.")

# Create Celery app
app = Celery(
    'rival_recon_worker',
    broker=os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    include=['worker.tasks', 'worker.recurring_scheduler', 'worker.worker']
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
    # 'process-pending-submissions': {
    #     'task': 'process_pending_submissions',
    #     'schedule': 60.0,  # Every minute
    # },
    'run-midnight-scheduler': {
        'task': 'run_midnight_scheduler',
        'schedule': crontab(minute=0, hour=0),  # Every day at midnight
    },
    # 'process-pending-refreshes': {
    #     'task': 'process_pending_refreshes',
    #     'schedule': 60.0,  # Every minute
    # }
}

if __name__ == '__main__':
    app.start() 