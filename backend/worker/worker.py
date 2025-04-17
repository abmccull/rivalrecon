import os
import json
import logging
import requests
import aiohttp
import asyncio
from bs4 import BeautifulSoup
from celery import Celery
from supabase import create_client, Client
from datetime import datetime
from typing import Dict, List, Optional, Union, Any
from dotenv import load_dotenv
from pathlib import Path
import uuid
import re  # Import re module for date parsing helper

# Set up logging to both file and console
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('celery.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_KEY')

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required")

logger.info(f"Initializing Supabase client with URL: {supabase_url}")
supabase: Client = create_client(supabase_url, supabase_key)

# Initialize Celery
app = Celery('rivalrecon',
             broker=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
             backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0'))

app.conf.update(
    task_serializer='json', # Standard JSON serializer
    accept_content=['json'],  # Accept only standard JSON
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    broker_transport_options = {'visibility_timeout': 3600} # Example visibility timeout
)

# Known Shopify domains (add more as needed)
KNOWN_SHOPIFY_DOMAINS = [".myshopify.com"]

# --- Helper Function for Date Parsing ---
def parse_review_date(date_str: Optional[str]) -> Optional[str]:
    """Attempts to parse various date string formats into YYYY-MM-DD."""
    if not date_str:
        return None
    
    # Extract the core date part (e.g., "September 18, 2024" from "Reviewed in ... on September 18, 2024")
    match = re.search(r'(\w+ \d{1,2}, \d{4})$', date_str)
    if match:
        date_part = match.group(1)
    else:
        date_part = date_str # Assume the string might already be in a parsable format

    # Common date formats to try
    formats_to_try = [
        "%B %d, %Y",  # September 18, 2024
        "%Y-%m-%d",  # 2024-09-18
        "%d/%m/%Y",  # 18/09/2024
        "%m/%d/%Y"   # 09/18/2024
    ]
    
    for fmt in formats_to_try:
        try:
            parsed_date = datetime.strptime(date_part, fmt)
            return parsed_date.strftime("%Y-%m-%d")
        except ValueError:
            continue
            
    logger.warning(f"Could not parse date string: '{date_str}' with any known format.")
    return None

# --- Helper Function for Price Cleaning ---
def parse_price(price_str: Optional[str]) -> Optional[float]:
    """Attempts to parse a price string (e.g., '$204.00') into a float."""
    if not price_str or not isinstance(price_str, str):
        return None
    try:
        # Remove currency symbols, commas, and whitespace
        cleaned_price = re.sub(r'[$,\s]', '', price_str)
        return float(cleaned_price)
    except (ValueError, TypeError):
        logger.warning(f"Could not parse price string: '{price_str}'")
        return None

@app.task(name='worker.scrape_reviews')
def scrape_reviews(submission_id: str, url: str) -> None:
    try:
        logger.info(f"[Submission ID: {submission_id}] Starting scraping task for URL: {url}")
        # Update submission status to processing
        supabase.table("submissions").update({"status": "processing"}).eq("id", submission_id).execute()

        # Determine the platform and scrape reviews/product details
        product_details = None
        reviews_list = []
        if "amazon" in url.lower():
            # Scrape Amazon - This function now fetches both details and reviews
            scraped_data = asyncio.run(scrape_amazon_data(submission_id, url))
            product_details = scraped_data.get("product_details")
            reviews_list = scraped_data.get("reviews", [])
            logger.info(f"[Submission ID: {submission_id}] Amazon scraping complete. Details fetched: {product_details is not None}. Reviews fetched: {len(reviews_list)}")

        elif "shopify" in url.lower() or any(domain in url.lower() for domain in KNOWN_SHOPIFY_DOMAINS):
            # Scrape Shopify (Assuming this returns a similar structure for now, adjust if needed)
            # TODO: Refactor scrape_shopify_reviews similarly if necessary
            scraped_data = asyncio.run(scrape_shopify_reviews(submission_id, url)) # Assuming returns {'product': {...}, 'reviews': [...]}
            product_details = scraped_data.get("product") # Adapt keys as needed
            reviews_list = scraped_data.get("reviews", [])
            logger.info(f"[Submission ID: {submission_id}] Shopify scraping complete. Details fetched: {product_details is not None}. Reviews fetched: {len(reviews_list)}")

        else:
            logger.error(f"[Submission ID: {submission_id}] Unsupported platform for URL: {url}")
            raise ValueError("Unsupported platform")

        # --- Update Submission with Product Details ---
        if product_details:
            try:
                update_data = {
                    "product_title": product_details.get("title"),
                    "brand_name": product_details.get("brand"),
                    "category_name": product_details.get("category"),
                    "product_overall_rating": product_details.get("rating"),
                    "product_num_ratings": product_details.get("num_ratings"),
                    "price": product_details.get("price"),
                    "currency": product_details.get("currency"),
                    "availability": product_details.get("availability"),
                    "product_description": product_details.get("description"),
                    "product_url": product_details.get("url"),
                    "asin": product_details.get("asin"),
                    "sales_volume": product_details.get("sales_volume"),
                    "is_best_seller": product_details.get("is_best_seller"),
                    "is_amazon_choice": product_details.get("is_amazon_choice"),
                    "is_prime": product_details.get("is_prime"),
                    "climate_pledge_friendly": product_details.get("climate_pledge_friendly"),
                    # Store complex fields as JSONB
                    "product_features": json.dumps(product_details.get("features", [])) if product_details.get("features") else None,
                    "product_images": json.dumps(product_details.get("images", [])) if product_details.get("images") else None,
                    "product_specifications": json.dumps(product_details.get("specifications", {})) if product_details.get("specifications") else None,
                    "product_details_misc": json.dumps(product_details.get("details_misc", {})) if product_details.get("details_misc") else None,
                    "product_variants": json.dumps(product_details.get("variants", {})) if product_details.get("variants") else None,
                    "api_response_product_details": json.dumps(product_details.get("raw_api_response", {})) if product_details.get("raw_api_response") else None, # Store raw response if needed
                    "status": "details_fetched" # Intermediate status
                }
                # Remove None values to avoid inserting NULLs where default might be better or column doesn't allow NULL
                update_data_cleaned = {k: v for k, v in update_data.items() if v is not None}

                logger.debug(f"[Submission ID: {submission_id}] Updating submission with product details: {json.dumps(list(update_data_cleaned.keys()))}")
                supabase.table("submissions").update(update_data_cleaned).eq("id", submission_id).execute()
                logger.info(f"[Submission ID: {submission_id}] Successfully updated submission with product details.")
            except Exception as update_err:
                logger.error(f"[Submission ID: {submission_id}] Error updating submission with product details: {update_err}")
                # Decide if this is fatal or if we can proceed with review insertion
                # raise # Optional: re-raise if product details are essential

        else:
             logger.warning(f"[Submission ID: {submission_id}] No product details were fetched. Skipping submission update.")
             # Potentially update status to indicate missing details


        # --- Insert Individual Reviews ---
        if not reviews_list:
            logger.warning(f"[Submission ID: {submission_id}] No reviews found or fetched. Finishing task.")
             # Update submission status to completed (or a specific status like 'no_reviews')
            final_status = "completed_no_reviews" if product_details else "failed_no_reviews"
            supabase.table("submissions").update({"status": final_status}).eq("id", submission_id).execute()
            return # Exit task if no reviews

        successful_inserts = 0
        failed_inserts = 0
        logger.info(f"[Submission ID: {submission_id}] Starting insertion of {len(reviews_list)} reviews.")

        for review in reviews_list:
            try:
                # Extract and process review-specific data
                review_rating_str = review.get("review_star_rating")
                review_rating = float(review_rating_str) if review_rating_str is not None else None

                review_date_str = review.get("review_date")
                review_date = parse_review_date(review_date_str) # Use helper

                review_data = {
                    "submission_id": submission_id,
                    # --- Review Specific Fields ---
                    "review_text": review.get("review_comment", "").strip() if review.get("review_comment") else None,
                    "review_rating": review_rating,
                    "review_date": review_date,
                    "review_title": review.get("review_title", "").strip() if review.get("review_title") else None,
                    "review_images": review.get("review_images", []), # Pass list directly for JSONB
                    "verified_purchase": review.get("is_verified_purchase", False),
                    # --- Optional Review Fields from API ---
                    "api_review_id": review.get("review_id"),
                    "review_author": review.get("review_author"),
                    "helpful_votes_text": review.get("helpful_vote_statement"),
                    "is_vine_review": review.get("is_vine", False)
                    # Add other fields from the API review object if needed in the DB
                }

                # Remove None values before insertion
                review_data_cleaned = {k: v for k, v in review_data.items() if v is not None}

                # Log sample of the data being inserted (first review only)
                if successful_inserts == 0:
                    logger.debug(f"[Submission ID: {submission_id}] Sample review data for insertion: {json.dumps(review_data_cleaned, default=str)}")

                # Execute insert
                insert_response = supabase.table("reviews").insert(review_data_cleaned).execute()

                # Check for errors in insert response if the API provides detailed errors
                # if insert_response.error:
                #    logger.error(f"[Submission ID: {submission_id}] Supabase insert error: {insert_response.error.message}")
                #    failed_inserts += 1
                #    continue # Skip to next review

                successful_inserts += 1

                if successful_inserts % 50 == 0:  # Log progress every 50 reviews
                    logger.info(f"[Submission ID: {submission_id}] Successfully inserted {successful_inserts}/{len(reviews_list)} reviews so far.")

            except Exception as insert_error:
                failed_inserts += 1
                logger.error(f"[Submission ID: {submission_id}] Error processing or inserting review: {insert_error}. Review data: {review.get('review_id', 'N/A')}")
                # Log the problematic review data for debugging if possible
                logger.debug(f"[Submission ID: {submission_id}] Failed review data sample: {json.dumps(review, default=str)}")
                continue # Continue to next review

        logger.info(f"[Submission ID: {submission_id}] Completed review insertion loop. Success: {successful_inserts}, Failed: {failed_inserts}")

        # --- Final Submission Status Update ---
        final_status = "completed" if successful_inserts > 0 else "failed"
        if failed_inserts > 0:
            final_status = "completed_with_errors" # Or another status to indicate partial success

        logger.info(f"[Submission ID: {submission_id}] Setting final status to: {final_status}")
        supabase.table("submissions").update({"status": final_status}).eq("id", submission_id).execute()
        logger.info(f"[Submission ID: {submission_id}] Task finished.")

    except Exception as e:
        logger.exception(f"[Submission ID: {submission_id}] Unhandled error in scrape_reviews task: {str(e)}")
        try:
            # Attempt to update submission status to failed
            supabase.table("submissions").update({"status": "failed"}).eq("id", submission_id).execute()
        except Exception as final_status_update_error:
            logger.error(f"[Submission ID: {submission_id}] Failed to update status to 'failed' after error: {final_status_update_error}")
        raise # Re-raise the original exception for Celery to handle

@app.task(name='worker.analyze_reviews')
def analyze_reviews(submission_id: str):
    try:
        logger.info(f"[Analyze Task - Submission ID: {submission_id}] Starting analysis.")
        # Fetch reviews from database - only select necessary columns
        reviews_response = supabase.table('reviews').select('review_text').eq('submission_id', submission_id).execute()

        if not reviews_response.data:
             logger.warning(f"[Analyze Task - Submission ID: {submission_id}] No reviews found in DB for analysis.")
             return {'status': 'skipped', 'message': 'No reviews found for analysis'}

        reviews_texts = [r['review_text'] for r in reviews_response.data if r.get('review_text')]
        logger.info(f"[Analyze Task - Submission ID: {submission_id}] Found {len(reviews_texts)} reviews with text for analysis.")

        if not reviews_texts:
             logger.warning(f"[Analyze Task - Submission ID: {submission_id}] No reviews with text content found.")
             return {'status': 'skipped', 'message': 'No reviews with text content found'}


        # TODO: Implement the actual call to DeepSeek API or your analysis function
        # analysis_results = analyze_reviews_with_deepseek(reviews_texts)
        # For now, let's simulate a result
        analysis_results = {
             'sentiment_score': 0.75, # Example value
             'key_themes': ['customer service', 'battery life', 'condition'], # Example value
             'summary': 'Overall positive feedback focusing on excellent customer service and good phone condition, with some comments on battery.' # Example value
        }
        logger.info(f"[Analyze Task - Submission ID: {submission_id}] Analysis simulation complete.")


        # Insert analysis results into the 'analyses' table
        # Ensure the 'analyses' table schema matches these fields
        analysis_data = {
            # 'id': str(uuid.uuid4()), # Let Supabase handle ID generation if it's a serial/UUID primary key
            'submission_id': submission_id,
            'sentiment_score': analysis_results.get('sentiment_score'),
            'key_themes': json.dumps(analysis_results.get('key_themes', [])), # Store as JSONB
            'summary': analysis_results.get('summary'),
            # 'created_at': datetime.utcnow().isoformat() # Let Supabase handle default timestamp
        }
        analysis_data_cleaned = {k: v for k, v in analysis_data.items() if v is not None}

        logger.debug(f"[Analyze Task - Submission ID: {submission_id}] Inserting analysis data: {json.dumps(analysis_data_cleaned, default=str)}")
        insert_response = supabase.table('analyses').insert(analysis_data_cleaned).execute()

        # Check insert_response for errors if needed

        logger.info(f"[Analyze Task - Submission ID: {submission_id}] Analysis results saved successfully.")
        return {'status': 'success', 'message': 'Successfully analyzed reviews and saved results'}

    except Exception as e:
        logger.exception(f"[Analyze Task - Submission ID: {submission_id}] Error during analysis: {str(e)}")
        return {'status': 'error', 'message': str(e)}

def detect_platform(url: str) -> str:
    """
    Detect the e-commerce platform from the URL
    """
    if 'amazon.com' in url.lower():
        return 'amazon'
    elif '.myshopify.com' in url.lower() or '/products/' in url.lower():
        # Basic check, might need refinement for non-standard Shopify URLs
        return 'shopify'
    # Add more platform detections here (e.g., etsy, walmart)
    else:
        logger.warning(f"Could not detect platform for URL: {url}")
        return 'unknown'

def get_amazon_product_details(product_id: str, country: str = 'US', api_key: str = None, api_host: str = None) -> Optional[Dict[str, Any]]:
    """
    Fetch product details from Amazon using RapidAPI (/product-details endpoint).
    Extracts and formats relevant fields based on the known API response structure.

    Args:
        product_id (str): Amazon ASIN
        country (str): Country code (default: 'US')
        api_key (str, optional): RapidAPI key. Defaults to env var.
        api_host (str, optional): RapidAPI host. Defaults to env var.

    Returns:
        Dict containing structured product information, or None if fetching fails.
        The dict includes a 'raw_api_response' key with the original JSON data.
    """
    if not api_key:
        api_key = os.getenv('RAPIDAPI_KEY')
    if not api_host:
        api_host = os.getenv('RAPIDAPI_HOST')

    if not api_key or not api_host:
        logger.error("RapidAPI credentials (Key or Host) not found in environment variables.")
        raise ValueError("RapidAPI credentials not found")

    headers = {
        'X-RapidAPI-Key': api_key,
        'X-RapidAPI-Host': api_host
    }
    params = {
        'asin': product_id,
        'country': country
    }
    endpoint_url = f'https://{api_host}/product-details'

    try:
        logger.debug(f"Requesting product details for ASIN {product_id} from {endpoint_url}")
        response = requests.get(endpoint_url, headers=headers, params=params, timeout=30) # Added timeout

        if response.status_code != 200:
            logger.error(f"Product details API error for ASIN {product_id}: Status {response.status_code}, Response: {response.text}")
            return None # Return None on API error

        raw_data = response.json()
        api_data = raw_data.get('data', {}) # Look within the 'data' object
        logger.debug(f"Raw product details response for ASIN {product_id}: {json.dumps(api_data)}")

        if not api_data:
             logger.warning(f"No 'data' field found in product details response for ASIN {product_id}")
             return None


        # --- Extract and Format Data ---
        details = {
            'asin': api_data.get('asin'),
            'title': api_data.get('product_title'),
            'url': api_data.get('product_url'),
            'description': api_data.get('product_description'),
            'currency': api_data.get('currency'),
            'availability': api_data.get('product_availability'),
            'sales_volume': api_data.get('sales_volume'),
            'is_best_seller': api_data.get('is_best_seller'),
            'is_amazon_choice': api_data.get('is_amazon_choice'),
            'is_prime': api_data.get('is_prime'),
            'climate_pledge_friendly': api_data.get('climate_pledge_friendly'),

            # Fields requiring cleaning/conversion
            'price': parse_price(api_data.get('product_price')),
            'rating': float(api_data['product_star_rating']) if api_data.get('product_star_rating') else None,
            'num_ratings': int(api_data['product_num_ratings']) if api_data.get('product_num_ratings') is not None else None,

            # Fields requiring specific mapping
            'brand': api_data.get('product_details', {}).get('Brand') or api_data.get('product_byline'), # Prioritize structured data
            'category': api_data.get('category', {}).get('name'), # Get category name

            # Complex fields (store as is, will be JSON dumped later)
            'features': api_data.get('about_product', []),
            'images': api_data.get('product_photos', []),
            'specifications': api_data.get('product_information', {}),
            'details_misc': api_data.get('product_details', {}), # Store the nested product_details object
            'variants': api_data.get('all_product_variations', {}),

            # Store the raw response for potential future use/debugging
            'raw_api_response': api_data
        }

        # Basic validation
        if not details['title']:
            logger.error(f"Critical field 'product_title' not found in API response for ASIN {product_id}.")
            # Decide if this should return None or raise an error based on requirements
            return None

        logger.debug(f"Processed product details for ASIN {product_id}: {json.dumps({k: v for k, v in details.items() if k != 'raw_api_response'}, default=str)}") # Log processed data without raw response
        return details

    except requests.exceptions.RequestException as e:
        logger.error(f"Network error while fetching product details for ASIN {product_id}: {str(e)}")
        return None # Return None on network error
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON response for product details ASIN {product_id}: {str(e)}. Response text: {response.text if 'response' in locals() else 'N/A'}")
        return None # Return None on JSON error
    except Exception as e:
        logger.exception(f"Unexpected error while fetching or processing product details for ASIN {product_id}: {str(e)}")
        return None # Return None on other errors

async def make_rapidapi_request(host: str, endpoint: str, params: Dict[str, str]) -> Optional[Dict[str, Any]]:
    """
    Make an async request to RapidAPI. Returns None on failure.
    """
    # --- Enhanced Logging: Add submission_id if possible, or pass explicitly ---
    submission_id = params.get('submission_id_for_logging', 'N/A') # Try to get if passed
    log_prefix = f"[RapidAPI Request - Submission ID: {submission_id}]"
    # --- End Enhanced Logging ---

    api_key = os.getenv('RAPIDAPI_KEY')
    if not api_key:
        logger.error(f"{log_prefix} RAPIDAPI_KEY environment variable is required")
        raise ValueError("RAPIDAPI_KEY environment variable is required")

    headers = {
        'X-RapidAPI-Key': api_key,
        'X-RapidAPI-Host': host
    }
    url = f'https://{host}{endpoint}'
    # Remove sensitive params for logging if necessary
    log_params = {k: v for k, v in params.items() if k != 'submission_id_for_logging'}
    logger.debug(f"{log_prefix} Making request to: {url} with params: {log_params}")

    response_status = None
    response_text = None
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, params=log_params, timeout=45) as response: # Increased timeout
                response_status = response.status
                if response.status != 200:
                    response_text = await response.text()
                    logger.error(f"{log_prefix} RapidAPI error: Status {response_status} URL: {url} Response: {response_text}")
                    return None # Return None on API error
                try:
                    json_response = await response.json()
                    logger.debug(f"{log_prefix} RapidAPI success. Status: {response_status}. URL: {url}. Response keys: {list(json_response.keys())}")
                    return json_response
                except aiohttp.ContentTypeError:
                    # Handle cases where response is not JSON
                    response_text = await response.text()
                    logger.error(f"{log_prefix} RapidAPI response was not JSON. URL: {url}. Status: {response_status}. Response: {response_text}")
                    return None
                except json.JSONDecodeError:
                     # Handle cases where JSON parsing fails
                    response_text = await response.text()
                    logger.error(f"{log_prefix} RapidAPI JSON decode error. URL: {url}. Status: {response_status}. Response: {response_text}")
                    return None

    except asyncio.TimeoutError:
         logger.error(f"{log_prefix} RapidAPI request timed out. URL: {url}")
         return None
    except Exception as e:
        logger.exception(f"{log_prefix} Error making RapidAPI request to {url}: {str(e)}")
        return None # Return None on other exceptions

async def scrape_amazon_data(submission_id: str, url: str) -> Dict[str, Any]:
    """
    Fetches both product details and reviews for an Amazon product URL.

    Args:
        submission_id (str): The submission ID for logging context.
        url (str): The Amazon product URL.

    Returns:
        Dict containing 'product_details' (dict or None) and 'reviews' (list).
    """
    # --- Force logger level and add entry log ---
    logger.setLevel(logging.DEBUG) # Force DEBUG level for this task run
    logger.debug(f"***** [Submission ID: {submission_id}] ENTERING scrape_amazon_data *****")
    # ---

    results = {"product_details": None, "reviews": []}
    try:
        product_id = extract_amazon_product_id(url)
        if not product_id:
            logger.error(f"[Submission ID: {submission_id}] Could not extract product ID from URL: {url}")
            raise ValueError("Could not extract product ID from URL")

        logger.info(f"[Submission ID: {submission_id}] Extracted ASIN: {product_id}. Fetching product details.")
        # Get product details first
        product_details = get_amazon_product_details(product_id) # This is now synchronous
        if not product_details:
             logger.warning(f"[Submission ID: {submission_id}] Failed to get product details for ASIN {product_id}. Proceeding without details.")
             # No need to raise here, we can continue to scrape reviews if desired
             # raise ValueError(f"Failed to get product details for ASIN {product_id}")
        else:
             logger.info(f"[Submission ID: {submission_id}] Successfully retrieved product details for '{product_details.get('title', 'Unknown Product')}' (ASIN: {product_id}).")
             results["product_details"] = product_details


        # Get RapidAPI host from environment variable
        rapidapi_host = os.getenv('RAPIDAPI_HOST')
        if not rapidapi_host:
             logger.error("RAPIDAPI_HOST environment variable not found")
             raise ValueError("RAPIDAPI_HOST environment variable not found")

        logger.info(f"[Submission ID: {submission_id}] Starting review scraping for ASIN: {product_id}")
        all_reviews = []
        page = 1
        max_pages_to_fetch = 50 # Safety limit to prevent infinite loops

        # NEW LOOP STRATEGY: Keep fetching until a page returns no reviews or we hit the limit
        while page <= max_pages_to_fetch:
            review_params = {
                "asin": product_id,
                "country": "US", # Make configurable if needed
                "page": str(page),
                "sort_by": "TOP_REVIEWS", # Make configurable if needed
                "star_rating": "ALL",
                "verified_purchases_only": "false",
                "images_or_videos_only": "false",
                "current_format_only": "false"
            }
            # Log the page number we are requesting
            logger.info(f"[Submission ID: {submission_id}] Requesting reviews page {page}...")

            # --- Log before API call ---
            logger.debug(f"[Submission ID: {submission_id}] Preparing to call make_rapidapi_request for page {page}.")
            # Pass submission_id for logging within make_rapidapi_request
            api_params = review_params.copy()
            api_params['submission_id_for_logging'] = submission_id
            # ---
            reviews_response = await make_rapidapi_request(
                rapidapi_host,
                "/product-reviews", # Specific endpoint for reviews
                api_params
            )
            # --- Log after API call ---
            logger.debug(f"[Submission ID: {submission_id}] Returned from make_rapidapi_request for page {page}. Response received: {reviews_response is not None}")
            # ---

            if not reviews_response:
                logger.warning(f"[Submission ID: {submission_id}] No response or error fetching reviews page {page} for ASIN {product_id}. Stopping review fetch. [BREAKING LOOP]")
                break # Stop fetching if an error occurs

            # --- Enhanced Logging ---
            logger.debug(f"[Submission ID: {submission_id}] Raw reviews response keys for page {page}: {list(reviews_response.keys())}")
            if 'data' in reviews_response and isinstance(reviews_response['data'], dict):
                 logger.debug(f"[Submission ID: {submission_id}] 'data' field keys: {list(reviews_response['data'].keys())}")
            else:
                 logger.debug(f"[Submission ID: {submission_id}] 'data' field not found or not a dict in response.")
            # --- End Enhanced Logging ---

            # Extract reviews list - check both response structures observed
            reviews_list_page = None
            if isinstance(reviews_response.get('data'), dict) and 'reviews' in reviews_response['data']:
                 reviews_list_page = reviews_response['data']['reviews']
                 logger.debug(f"[Submission ID: {submission_id}] Extracted reviews using 'data.reviews'.")
            elif 'reviews' in reviews_response: # Fallback for older structure?
                 reviews_list_page = reviews_response['reviews']
                 logger.debug(f"[Submission ID: {submission_id}] Extracted reviews using 'reviews' key (fallback).")
            else:
                 logger.warning(f"[Submission ID: {submission_id}] 'reviews' key not found in expected location in API response for page {page}. Response keys: {list(reviews_response.keys())}. [TREATING AS EMPTY]")
                 reviews_list_page = [] # Assume no reviews if structure is wrong

            if not isinstance(reviews_list_page, list):
                 logger.warning(f"[Submission ID: {submission_id}] Expected 'reviews' to be a list, but got {type(reviews_list_page)} for page {page}. Stopping review fetch. [BREAKING LOOP]")
                 break

            # --- NEW: Check if the page returned any reviews ---
            if not reviews_list_page:
                logger.info(f"[Submission ID: {submission_id}] No reviews found on page {page}. Assuming end of reviews. [BREAKING LOOP]")
                break # Stop if no reviews returned on the current page
            # ---

            all_reviews.extend(reviews_list_page)
            logger.info(f"[Submission ID: {submission_id}] Retrieved {len(reviews_list_page)} reviews from page {page}. Total reviews so far: {len(all_reviews)}")

            page += 1

            await asyncio.sleep(1.5) # Keep delay between requests

        # Log outside the loop if the limit was hit
        if page > max_pages_to_fetch:
             logger.warning(f"[Submission ID: {submission_id}] Reached maximum page fetch limit ({max_pages_to_fetch}). Stopping review fetch.")

        results["reviews"] = all_reviews
        logger.info(f"[Submission ID: {submission_id}] Finished review scraping. Fetched {len(all_reviews)} reviews across {page-1} pages for ASIN {product_id}.")
        return results

    except Exception as e:
        logger.exception(f"[Submission ID: {submission_id}] Error in scrape_amazon_data for URL {url}: {str(e)}")
        # Return potentially partial results, the calling function handles DB updates
        return results


def extract_amazon_product_id(url: str) -> Optional[str]:
    """
    Extract product ID (ASIN) from various Amazon URL formats.
    """
    import re

    # Patterns ordered from more specific to less specific
    patterns = [
        r'/dp/([A-Z0-9]{10})',          # Standard /dp/ format
        r'/gp/product/([A-Z0-9]{10})', # /gp/product/ format
        r'/product-reviews/([A-Z0-9]{10})', # Found in review links
        r'/gp/aw/d/([A-Z0-9]{10})',    # Mobile format
        r'dp=([A-Z0-9]{10})',           # Parameter format (less common)
        r'asin=([A-Z0-9]{10})',         # Parameter format
    ]

    for pattern in patterns:
        match = re.search(pattern, url, re.IGNORECASE) # Added ignorecase
        if match:
            asin = match.group(1).upper() # Standardize to uppercase
            logger.debug(f"Extracted ASIN {asin} using pattern '{pattern}' from URL {url}")
            return asin

    # Fallback: Check if the last path component looks like an ASIN
    try:
        path_components = url.split('?')[0].split('/') # Split path, remove query params
        last_component = path_components[-1] if path_components else ''
        if re.match(r'^[A-Z0-9]{10}$', last_component, re.IGNORECASE):
             asin = last_component.upper()
             logger.debug(f"Extracted ASIN {asin} using fallback (last path component) from URL {url}")
             return asin
    except Exception as e:
         logger.warning(f"Error during fallback ASIN extraction from {url}: {e}")


    logger.warning(f"Could not extract ASIN from URL: {url}")
    return None

def scrape_shopify_reviews(submission_id: str, url: str) -> Dict[str, Any]:
    """
    Scrapes product reviews from a Shopify store product page
    !! Placeholder - Needs review and potential refactoring similar to Amazon !!

    Args:
        url (str): URL of the Shopify product page

    Returns:
        Dict containing:
        - product: Dict with name, brand, category, url (adapt as needed)
        - reviews: List of review dicts (adapt as needed)
    """
    logger.info(f"[Submission ID: {submission_id}] Starting Shopify scrape for URL: {url} (Placeholder implementation)")
    # This is a simplified placeholder and likely needs significant improvement
    # based on actual Shopify structures and review app variations (Loox, Judge.me etc.)
    product_details = {"title": "Shopify Product (Placeholder)", "brand": "Shopify Brand (Placeholder)", "url": url}
    reviews = []
    # Add basic scraping logic here if possible, or mark as placeholder/TODO
    logger.warning(f"[Submission ID: {submission_id}] Shopify scraping is currently a placeholder.")

    return {
        'product': product_details,
        'reviews': reviews
    }


def prepare_reviews_for_analysis(reviews_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare review data for DeepSeek API analysis (or other analysis tool)
    """
    # Adapt this based on the actual input needed by the analysis API
    return {
        'reviews': reviews_data.get('reviews', []), # Assuming it needs the list of review objects/texts
        'metadata': { # Example metadata that might be useful
            'product_name': reviews_data.get('product_name'),
            'brand': reviews_data.get('brand_name'),
            'category': reviews_data.get('category_name'),
            'asin': reviews_data.get('asin')
        }
    }


def call_deepseek_api(analysis_input: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    """
    Call DeepSeek API for review analysis
    !! Placeholder - Needs actual implementation !!
    """
    logger.warning("call_deepseek_api is a placeholder and needs implementation.")
    # This needs to be replaced with the actual DeepSeek API endpoint and logic
    # For now, return dummy data
    return {
        'sentiment_score': 0.8,
        'key_themes': ['quality', 'price', 'shipping'],
        'summary': 'Placeholder summary from DeepSeek API.'
    }

if __name__ == '__main__':
    # Example of how to run the task manually (for testing)
    # Make sure Celery worker is running: celery -A worker.app worker --loglevel=info
    # from worker import scrape_reviews
    # test_submission_id = "your_test_submission_id" # Get a valid ID from your DB
    # test_url = "https://www.amazon.com/dp/B07ZPKN6YR" # Example URL
    # scrape_reviews.delay(test_submission_id, test_url)
    # logger.info("Test task dispatched.")

    # Start Celery worker if this script is run directly (optional)
    # Note: Usually you run the worker separately using the celery command
    # app.worker_main(['worker', '--loglevel=INFO'])
    logger.info("Worker script initialized. Run celery worker separately.")

    # Start Celery worker
    app.start() 