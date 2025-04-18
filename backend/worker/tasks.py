from celery import Celery
import os
from typing import Dict, Any
import requests
import json
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

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
            return {'status': 'error', 'message': 'No reviews found for analysis'}

        product_response = supabase.table('submissions').select('url, product_details').eq('id', submission_id).single().execute()
        if not product_response.data:
            return {'status': 'error', 'message': 'Submission not found'}

        reviews = reviews_response.data
        product_details = product_response.data.get('product_details', {})

        # Prepare metadata for analysis
        metadata = {
            'product_name': product_details.get('title', 'Unknown Product'),
            'brand': product_details.get('brand', 'Unknown Brand'),
            'category': product_details.get('category', 'Unknown Category'),
            'asin': product_details.get('asin')
        }

        # Initialize DeepSeek API client
        api_key = os.getenv('DEEPSEEK_API_KEY')
        if not api_key:
            return {'status': 'error', 'message': 'DeepSeek API key not configured'}

        # Import here to avoid circular imports
        from services.deepseekService import DeepSeekService
        deepseek = DeepSeekService(api_key)

        # Perform analysis
        analysis_results = deepseek.analyzeReviews(reviews, metadata)

        # Store analysis results in Supabase
        analysis_data = {
            'submission_id': submission_id,
            'sentiment_score': analysis_results['sentiment_score'],
            'key_themes': analysis_results['key_themes'],
            'top_positives': analysis_results['top_positives'],
            'top_negatives': analysis_results['top_negatives'],
            'word_map': analysis_results['word_map'],
            'competitive_insights': analysis_results['competitive_insights'],
            'opportunities': analysis_results['opportunities'],
            'ratings_over_time': analysis_results['ratings_over_time'],
            'trending': analysis_results['trending'],
            'created_at': datetime.utcnow().isoformat()
        }

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
            raise Exception('Failed to store analysis results')

    except Exception as e:
        # Update submission status to failed
        supabase.table('submissions').update({'status': 'failed'}).eq('id', submission_id).execute()
        return {'status': 'error', 'message': str(e)}

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