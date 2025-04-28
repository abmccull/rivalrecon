from celery import Celery
import os
from typing import Dict, Any
import requests
import json
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
from celery.task import shared_task
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

@celery.task
def scrape_product_reviews(url: str) -> Dict[str, Any]:
    """
    Task to scrape product reviews based on the URL type
    """
    try:
        # Determine the type of URL and use appropriate scraper
        if 'amazon.com' in url:
            return scrape_amazon(url)
        elif any(platform in url for platform in ['shopify.com', 'myshopify.com']):
            return scrape_shopify(url)
        else:
            return {'error': 'Unsupported platform'}
    except Exception as e:
        return {'error': str(e)}

@celery.task
def analyze_reviews(submission_id: str) -> Dict[str, Any]:
    """
    Task to analyze reviews using DeepSeek API
    """
    try:
        # Fetch reviews and product details from Supabase
        reviews_response = supabase.table('reviews').select('*').eq('submission_id', submission_id).execute()
        if not reviews_response.data:
            # Update submission status to failed
            supabase.table('submissions').update({
                'status': 'failed', 
                'error_message': 'No reviews found for analysis'
            }).eq('id', submission_id).execute()
            return {'status': 'error', 'message': 'No reviews found for analysis'}

        product_response = supabase.table('submissions').select('*').eq('id', submission_id).single().execute()
        if not product_response.data:
            return {'status': 'error', 'message': 'Submission not found'}

        reviews = reviews_response.data
        product_details = product_response.data

        # Calculate basic metrics from the reviews data
        review_count = len(reviews)
        ratings = [float(review['review_rating']) for review in reviews if review.get('review_rating')]
        average_rating = sum(ratings) / len(ratings) if ratings else 0

        # Prepare metadata for analysis
        metadata = {
            'product_name': product_details.get('product_title', 'Unknown Product'),
            'brand': product_details.get('brand_name', 'Unknown Brand'),
            'category': product_details.get('category_name', 'Unknown Category'),
            'asin': product_details.get('asin'),
            'is_competitor_product': product_details.get('is_competitor_product', False)
        }

        # Initialize DeepSeek API client
        api_key = os.getenv('DEEPSEEK_API_KEY')
        if not api_key:
            # Update submission status to failed
            supabase.table('submissions').update({
                'status': 'failed', 
                'error_message': 'DeepSeek API key not configured'
            }).eq('id', submission_id).execute()
            return {'status': 'error', 'message': 'DeepSeek API key not configured'}

        # Import here to avoid circular imports
        from services.deepseekService import DeepSeekService
        deepseek = DeepSeekService(api_key)

        # Perform analysis - this will throw an error if analysis is incomplete
        analysis_results = deepseek.analyzeReviews(reviews, metadata)

        # Store analysis results in Supabase
        analysis_data = {
            'submission_id': submission_id,
            'review_count': review_count,
            'average_rating': average_rating,
            'sentiment_score': analysis_results['sentiment_score'],
            'sentiment_distribution': analysis_results['sentiment_distribution'],
            'keywords': analysis_results['keywords'],
            'product_features': analysis_results['product_features'],
            'ratings_over_time': analysis_results['ratings_over_time'],
            'rating_distribution': analysis_results['rating_distribution'],
            'key_insights': analysis_results['key_insights'],
            'improvement_opportunities': analysis_results['improvement_opportunities'],
            'review_text_sample': analysis_results['review_text_sample'],
            'top_positives': analysis_results['top_positives'],
            'top_negatives': analysis_results['top_negatives'],
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }

        # Support for legacy fields (only if they exist in the analysis results)
        if 'word_map' in analysis_results:
            analysis_data['word_map'] = analysis_results['word_map']
        
        if 'opportunities' in analysis_results:
            analysis_data['opportunities'] = analysis_results['opportunities']
        
        if 'key_themes' in analysis_results:
            analysis_data['key_themes'] = analysis_results['key_themes']
            
        if 'trending' in analysis_results:
            analysis_data['trending'] = analysis_results['trending']
        
        if 'competitive_insights' in analysis_results:
            analysis_data['competitive_insights'] = analysis_results['competitive_insights']

        # Add competitive fields if they exist
        if 'competitive_advantages' in analysis_results:
            analysis_data['competitive_advantages'] = analysis_results['competitive_advantages']
            
        if 'competitive_disadvantages' in analysis_results:
            analysis_data['competitive_disadvantages'] = analysis_results['competitive_disadvantages']

        # Insert analysis into Supabase
        result = supabase.table('analyses').insert(analysis_data).execute()
        
        if result.data:
            # Update submission status to completed
            supabase.table('submissions').update({'status': 'completed'}).eq('id', submission_id).execute()
            return {
                'status': 'success',
                'message': 'Analysis completed and stored successfully',
                'analysis_id': result.data[0]['id']
            }
        else:
            # Update submission status to failed
            supabase.table('submissions').update({
                'status': 'failed',
                'error_message': 'Failed to store analysis results'
            }).eq('id', submission_id).execute()
            raise Exception('Failed to store analysis results')

    except Exception as e:
        # Update submission status to failed with specific error message
        error_message = str(e)
        supabase.table('submissions').update({
            'status': 'failed',
            'error_message': error_message[:255]  # Limit error message length for storage
        }).eq('id', submission_id).execute()
        return {'status': 'error', 'message': error_message}

def scrape_amazon(url: str) -> Dict[str, Any]:
    """
    Scrape Amazon reviews using RapidAPI
    """
    api_key = os.getenv('RAPIDAPI_KEY')
    if not api_key:
        return {'error': 'RapidAPI key not configured'}
    
    # TODO: Implement RapidAPI call
    return {'status': 'Scraping completed', 'data': {}}

def scrape_shopify(url: str) -> Dict[str, Any]:
    """
    Scrape Shopify reviews using Scrapy
    """
    # TODO: Implement Scrapy scraper
    return {'status': 'Scraping completed', 'data': {}}

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