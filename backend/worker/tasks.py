from celery import Celery, chain, shared_task
import os
from typing import Dict, Any, Union
import requests
import json
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Initialize Celery with the correct namespace
celery = Celery('worker', broker=os.getenv('CELERY_BROKER_URL'))

# Initialize Supabase client after environment variables are loaded
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
    raise ValueError("Supabase URL and key are required")

supabase: Client = create_client(supabase_url, supabase_key)

logger = logging.getLogger(__name__)

# The scrape_reviews task has been moved to worker.py to avoid duplication
# Do not define it here to prevent conflicts with the robust implementation

# The Amazon scraping functionality has been moved to worker.py
# See scrape_amazon_data function in worker.py for the robust implementation

# The Shopify scraping functionality has been moved to worker.py
# See scrape_shopify_reviews function in worker.py for the robust implementation

@shared_task(name="refresh_submission")
def refresh_submission(submission_id):
    """
    Process a refresh submission which is linked to a parent submission.
    This will:
    1. Get the original submission and its reviews
    2. Scrape new reviews only (those after the latest review date)
    3. Run analysis on only the new reviews
    4. Update the original analysis with combined results
    5. Mark the original submission as 'completed' again
    """
    logger.info(f"Processing refresh for submission {submission_id}")
    
    try:
        # Get the refresh submission details
        response = supabase.table('submissions').select(
            "*"
        ).eq('id', submission_id).limit(1).execute()
        
        if not response.data:
            logger.error(f"Refresh submission {submission_id} not found")
            return
            
        refresh_submission = response.data[0]
        parent_id = refresh_submission.get('refresh_parent_id')
        
        if not parent_id:
            logger.error(f"Refresh submission {submission_id} has no parent ID")
            return
            
        # Get the original submission
        parent_response = supabase.table('submissions').select(
            "*"
        ).eq('id', parent_id).limit(1).execute()
        
        if not parent_response.data:
            logger.error(f"Parent submission {parent_id} not found")
            return
            
        parent_submission = parent_response.data[0]
        
        # Get the latest review date from the original submission
        reviews_response = supabase.table('reviews').select(
            "created_at"
        ).eq('submission_id', parent_id).order('created_at', {"ascending": False}).limit(1).execute()
        
        latest_review_date = None
        if reviews_response.data:
            latest_review_date = reviews_response.data[0]['created_at']
            logger.info(f"Latest review date: {latest_review_date}")
        
        # Scrape new reviews only
        url = parent_submission['url']
        logger.info(f"Scraping URL for new reviews: {url}")
        
        # Call the scraper with the since_date parameter
        # This would be your web scraper function
        # For example: scraper.scrape_reviews(url, since_date=latest_review_date)
        new_reviews = scrape_reviews(url, since_date=latest_review_date)
        
        if not new_reviews:
            logger.info(f"No new reviews found for {url}")
            # Update status back to completed
            supabase.table('submissions').update({
                'status': 'completed'
            }).eq('id', parent_id).execute()
            
            # Update refresh submission status
            supabase.table('submissions').update({
                'status': 'completed',
                'reviews_count': 0
            }).eq('id', submission_id).execute()
            
            return
            
        logger.info(f"Found {len(new_reviews)} new reviews")
        
        # Save new reviews to database with the refresh_submission_id
        for review in new_reviews:
            review['submission_id'] = submission_id
            
        reviews_response = supabase.table('reviews').insert(
            new_reviews
        ).execute()
        
        # Update refresh submission with review count
        supabase.table('submissions').update({
            'reviews_count': len(new_reviews),
            'status': 'processing'
        }).eq('id', submission_id).execute()
        
        # Analyze the new reviews
        analyze_reviews(submission_id)
        
        # Once analysis is complete, combine results with original analysis
        original_analysis_response = supabase.table('analyses').select(
            "*"
        ).eq('submission_id', parent_id).limit(1).execute()
        
        new_analysis_response = supabase.table('analyses').select(
            "*"
        ).eq('submission_id', submission_id).limit(1).execute()
        
        if original_analysis_response.data and new_analysis_response.data:
            # Combine analyses (this would be a complex merge operation)
            # For example, combining sentiment scores, updating trending data, etc.
            combined_analysis = combine_analyses(
                original_analysis_response.data[0],
                new_analysis_response.data[0]
            )
            
            # Update the original analysis with combined results
            supabase.table('analyses').update(
                combined_analysis
            ).eq('id', original_analysis_response.data[0]['id']).execute()
        
        # Mark original submission as completed again
        supabase.table('submissions').update({
            'status': 'completed',
            'last_refreshed_at': datetime.now().isoformat()
        }).eq('id', parent_id).execute()
        
        logger.info(f"Refresh completed for submission {parent_id}")
        
    except Exception as e:
        logger.exception(f"Error refreshing submission {submission_id}: {e}")
        
        # Update statuses to failed
        try:
            if parent_id:
                supabase.table('submissions').update({
                    'status': 'failed'
                }).eq('id', parent_id).execute()
                
            supabase.table('submissions').update({
                'status': 'failed'
            }).eq('id', submission_id).execute()
        except Exception as update_error:
            logger.exception(f"Error updating status after refresh failure: {update_error}")


def combine_analyses(original_analysis, new_analysis):
    """
    Combine an original analysis with a new analysis of recent reviews.
    This is a complex operation that needs to be customized based on your analysis structure.
    """
    # This is a simplified example - the actual implementation would depend on your analysis structure
    combined = original_analysis.copy()
    
    # Update fields that should reflect all data (e.g., review count, date ranges)
    combined['reviews_analyzed'] = original_analysis.get('reviews_analyzed', 0) + new_analysis.get('reviews_analyzed', 0)
    combined['updated_at'] = datetime.now().isoformat()
    
    # For arrays, append new items (e.g., top_positives, top_negatives)
    for field in ['top_positives', 'top_negatives', 'key_insights']:
        if isinstance(combined.get(field), list) and isinstance(new_analysis.get(field), list):
            # Create a set of existing items to avoid duplicates
            existing_items = set(item.lower() if isinstance(item, str) else str(item) for item in combined[field])
            
            # Add new items that aren't duplicates
            for item in new_analysis[field]:
                item_key = item.lower() if isinstance(item, str) else str(item)
                if item_key not in existing_items:
                    combined[field].append(item)
                    existing_items.add(item_key)
            
            # Trim to reasonable size
            combined[field] = combined[field][:20]  # Limit to 20 items
    
    # For numeric values, compute weighted average (e.g., sentiment scores)
    # Weight by number of reviews
    original_weight = original_analysis.get('reviews_analyzed', 0)
    new_weight = new_analysis.get('reviews_analyzed', 0)
    total_weight = original_weight + new_weight
    
    if total_weight > 0:
        for field in ['sentiment_score', 'overall_score']:
            if field in original_analysis and field in new_analysis:
                combined[field] = (
                    (original_analysis[field] * original_weight) + 
                    (new_analysis[field] * new_weight)
                ) / total_weight
    
    # Return the combined analysis
    return combined 

@shared_task(name="process_pending_refreshes")
def process_pending_refreshes():
    """
    Process all pending refresh submissions.
    This task runs periodically to check for submissions with:
    1. status = 'pending'
    2. refresh_parent_id is not null
    """
    logger.info("Checking for pending refresh submissions")
    
    try:
        # Find pending refresh submissions
        response = supabase.table('submissions').select(
            "id"
        ).eq('status', 'pending').not_.is_('refresh_parent_id', 'null').execute()
        
        if not response.data:
            return
            
        refresh_submissions = response.data
        logger.info(f"Found {len(refresh_submissions)} pending refresh submissions")
        
        # Process each refresh submission
        for submission in refresh_submissions:
            refresh_submission.delay(submission['id'])
            
        logger.info(f"Queued {len(refresh_submissions)} refresh submissions for processing")
        
    except Exception as e:
        logger.exception(f"Error processing pending refresh submissions: {e}") 