import os
import json
import logging
from datetime import datetime, timedelta

import supabase
from celery import shared_task
# from .tasks import process_pending_submissions

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Supabase client
supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
    logger.error("Supabase credentials not found in environment variables")
    raise ValueError("Supabase credentials not configured")

supabase_client = supabase.create_client(supabase_url, supabase_key)


@shared_task(name="run_midnight_scheduler")
def run_midnight_scheduler():
    """
    Task to run at midnight to process all recurring analyses due today.
    This checks for all active recurring analyses with next_run date of today
    and triggers a new analysis for each.
    """
    logger.info("Starting midnight scheduler for recurring analyses")
    
    # Get current date at midnight
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)
    
    today_str = today.isoformat()
    tomorrow_str = tomorrow.isoformat()
    
    logger.info(f"Processing jobs due between {today_str} and {tomorrow_str}")
    
    # Find all active recurring analyses due today
    try:
        response = supabase_client.table('recurring_analyses').select(
            "id, user_id, submission_id, interval, day_of_week, last_run, next_run"
        ).eq('status', 'active') \
         .gte('next_run', today_str) \
         .lt('next_run', tomorrow_str).execute()
        
        due_jobs = response.data
        logger.info(f"Found {len(due_jobs)} jobs to process for today")
        
        # Process each job
        for job in due_jobs:
            try:
                # Get the original submission
                submission_response = supabase_client.table('submissions').select(
                    "*"
                ).eq('id', job['submission_id']).limit(1).execute()
                
                if not submission_response.data:
                    logger.error(f"Original submission not found for job {job['id']}")
                    continue
                
                original_submission = submission_response.data[0]
                
                # Create a new submission based on the original
                new_submission = {
                    'url': original_submission['url'],
                    'user_id': job['user_id'],
                    'is_competitor_product': original_submission['is_competitor_product'],
                    'status': 'pending',
                    'recurring_parent_id': job['submission_id']
                }
                
                # Insert the new submission
                insert_response = supabase_client.table('submissions').insert(
                    new_submission
                ).execute()
                
                if not insert_response.data:
                    logger.error(f"Failed to create new submission for job {job['id']}")
                    continue
                
                new_submission_id = insert_response.data[0]['id']
                logger.info(f"Created new submission {new_submission_id} for recurring job {job['id']}")
                
                # Queue the submission for processing
                # process_pending_submissions.delay(new_submission_id)
                logger.info(f"Queued submission {new_submission_id} for processing")
                
                # Calculate next run date
                next_run = calculate_next_run(job['interval'], job.get('day_of_week'), today)
                
                # Update the recurring job
                update_response = supabase_client.table('recurring_analyses').update({
                    'last_run': today_str,
                    'next_run': next_run.isoformat(),
                    'updated_at': datetime.now().isoformat()
                }).eq('id', job['id']).execute()
                
                logger.info(f"Updated recurring job {job['id']}, next run: {next_run.isoformat()}")
                
            except Exception as e:
                logger.exception(f"Error processing recurring job {job['id']}: {e}")
        
        logger.info(f"Completed processing {len(due_jobs)} recurring jobs")
        
    except Exception as e:
        logger.exception(f"Error running midnight scheduler: {e}")


def calculate_next_run(interval, day_of_week, from_date):
    """
    Calculate the next run date based on the interval and optional day of week.
    
    Args:
        interval (str): 'weekly', 'biweekly', or 'monthly'
        day_of_week (int, optional): 0-6 for Monday-Sunday
        from_date (datetime): Base date to calculate from
        
    Returns:
        datetime: Next run date at midnight
    """
    next_run = from_date.replace(hour=0, minute=0, second=0, microsecond=0)
    
    if interval == 'weekly':
        next_run = next_run + timedelta(days=7)
        
        # If day_of_week is specified, adjust to that day
        if day_of_week is not None:
            current_day = next_run.weekday()  # 0 is Monday in datetime
            days_to_add = (7 + day_of_week - current_day) % 7
            if days_to_add > 0:
                next_run = next_run + timedelta(days=days_to_add)
    
    elif interval == 'biweekly':
        next_run = next_run + timedelta(days=14)
    
    elif interval == 'monthly':
        # Add one month (handle different month lengths)
        if next_run.month == 12:
            next_run = next_run.replace(year=next_run.year + 1, month=1)
        else:
            next_run = next_run.replace(month=next_run.month + 1)
    else:
        # Default to weekly if invalid interval
        next_run = next_run + timedelta(days=7)
    
    return next_run


if __name__ == "__main__":
    # For testing: run the scheduler directly
    run_midnight_scheduler() 