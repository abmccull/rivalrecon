import os
import json
import logging
import requests
import aiohttp
import asyncio
import json
import os
import re
import statistics
import traceback
import uuid
import random
from bs4 import BeautifulSoup
from celery import Celery
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from supabase import create_client, Client
from typing import Any, Dict, List, Optional, Union

# Helper function to extract helpful votes count from text
def extract_helpful_votes(votes_text: str) -> int:
    """Extract the helpful votes count from a text like '93 people found this helpful'"""
    if not votes_text:
        return 0
    
    # Use regex to extract the number
    match = re.search(r'(\d+)', votes_text)
    if match:
        return int(match.group(1))
    return 0

def parse_amazon_review_date(date_text: str) -> str:
    """
    Parse a date string from Amazon review format to ISO format
    Handles the RapidAPI format: "Reviewed in the United States on September 18, 2024"
    """
    if not date_text or not date_text.strip():
        logger.debug(f"No review date provided in API response")
        return ""  # Return empty string for missing dates
    
    # Log the date format we're trying to parse for debugging purposes
    logger.debug(f"Attempting to parse review date: '{date_text}'")
    
    # If it's already in ISO format
    if re.match(r'^\d{4}-\d{2}-\d{2}T', date_text):
        logger.debug(f"Date is already in ISO format: {date_text}")
        return date_text

    # Match "Reviewed in X on DATE" pattern
    # This is the standard format from RapidAPI as documented
    reviewed_in_match = re.search(r'Reviewed in .+? on (.+?)$', date_text)
    if reviewed_in_match:
        date_part = reviewed_in_match.group(1).strip()
        logger.debug(f"Extracted date part: '{date_part}'")
        try:
            # Try "Month Day, Year" format (September 18, 2024)
            parsed_date = datetime.strptime(date_part, "%B %d, %Y")
            iso_date = parsed_date.isoformat()
            logger.debug(f"Successfully parsed date '{date_part}' to ISO format: {iso_date}")
            return iso_date
        except ValueError as e:
            logger.warning(f"Failed to parse standard date format '{date_part}': {e}")
            
            # Try alternative formats
            alternative_formats = [
                "%b %d, %Y",      # Sep 18, 2024
                "%d %B, %Y",      # 18 September, 2024
                "%d %b, %Y",      # 18 Sep, 2024
                "%B %d %Y",       # September 18 2024
                "%d %B %Y"        # 18 September 2024
            ]
            
            for fmt in alternative_formats:
                try:
                    parsed_date = datetime.strptime(date_part, fmt)
                    iso_date = parsed_date.isoformat()
                    logger.debug(f"Successfully parsed date '{date_part}' with alternative format {fmt} to ISO: {iso_date}")
                    return iso_date
                except ValueError:
                    continue
    
    # Match any direct date format that might be in the string, like "September 18, 2024"
    # This is a fallback in case the "Reviewed in" pattern changes
    date_patterns = [
        r'([A-Za-z]+ \d{1,2}, \d{4})',             # September 18, 2024
        r'(\d{1,2} [A-Za-z]+,? \d{4})',            # 18 September, 2024 or 18 September 2024
        r'(\d{4}-\d{2}-\d{2})'                     # 2024-09-18
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, date_text)
        if match:
            date_part = match.group(1).strip()
            logger.debug(f"Matched date pattern {pattern} with result: '{date_part}'")
            
            # Try different date formats
            formats_to_try = [
                "%B %d, %Y",      # September 18, 2024
                "%b %d, %Y",      # Sep 18, 2024
                "%d %B, %Y",      # 18 September, 2024
                "%d %b, %Y",      # 18 Sep, 2024
                "%d %B %Y",       # 18 September 2024
                "%d %b %Y",       # 18 Sep 2024
                "%Y-%m-%d"        # 2024-09-18
            ]
            
            for fmt in formats_to_try:
                try:
                    parsed_date = datetime.strptime(date_part, fmt)
                    iso_date = parsed_date.isoformat()
                    logger.debug(f"Successfully parsed direct date '{date_part}' with format {fmt} to ISO: {iso_date}")
                    return iso_date
                except ValueError:
                    continue
    
    # As a last resort, try dateutil parser which can handle many formats
    try:
        from dateutil import parser
        parsed_date = parser.parse(date_text, fuzzy=True)
        iso_date = parsed_date.isoformat()
        logger.debug(f"Parsed date with dateutil: '{date_text}' to ISO: {iso_date}")
        return iso_date
    except Exception as e:
        logger.warning(f"Even dateutil parser failed on '{date_text}': {e}")
    
    # Still couldn't parse, log and return empty string
    logger.warning(f"Could not parse date string: '{date_text}' with any known format")
    return ""

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
logger.setLevel(logging.DEBUG) # Explicitly set level for this logger

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') # Use the service role key

if not supabase_url or not supabase_key:
    logger.error("Supabase credentials not found in environment variables")
    raise ValueError("Supabase credentials not configured")

supabase = create_client(supabase_url, supabase_key)
logger.info("Supabase client initialized successfully")

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
KNOWN_SHOPIFY_DOMAINS = ["myshopify.com", "shop.app"]

# Amazon scraping implementation
async def scrape_amazon_data(submission_id: str, url: str) -> Dict[str, Any]:
    """
    Asynchronously scrape Amazon product details and reviews using RapidAPI.
    
    Args:
        submission_id: The ID of the submission in Supabase
        url: The Amazon product URL to scrape
        
    Returns:
        Dictionary with product_details and reviews keys
    """
    logger.info(f"[Submission ID: {submission_id}] Starting Amazon scraping via RapidAPI for URL: {url}")
    
    product_details = None
    reviews_list = []
    result = {
        "product_details": product_details,
        "reviews": reviews_list
    }
    
    # Extract ASIN from the URL - required for API calls
    asin = None
    
    # Log the URL we're processing for debugging
    logger.info(f"[Submission ID: {submission_id}] Processing URL: {url}")
    
    # Try multiple regex patterns to extract ASIN from various Amazon URL formats
    asin_patterns = [
        r"/([A-Z0-9]{10})(?:/|\?|$)",  # Standard format
        r"dp/([A-Z0-9]{10})",          # dp format
        r"product/([A-Z0-9]{10})",     # product format
        r"ASIN/([A-Z0-9]{10})",        # ASIN format
        r"(?:dp|gp/product|dp/product)/([A-Z0-9]{10})" # Combined format
    ]
    
    for pattern in asin_patterns:
        asin_match = re.search(pattern, url)
        if asin_match:
            asin = asin_match.group(1)
            logger.info(f"[Submission ID: {submission_id}] Extracted ASIN: {asin} using pattern: {pattern}")
            break
    
    if not asin:
        logger.error(f"[Submission ID: {submission_id}] Could not extract ASIN from URL: {url}")
        supabase.table("submissions").update({"status": "failed", "error_message": "Could not extract ASIN from URL."}).eq("id", submission_id).execute()
        return result # Return empty result
    
    # Clean the original submission URL to remove tracking parameters which might be confusing the system
    clean_amazon_url = f"https://www.amazon.com/dp/{asin}"
    logger.info(f"[Submission ID: {submission_id}] Using clean Amazon URL: {clean_amazon_url}")
    
    # Update the submission with the clean URL immediately to avoid confusion
    try:
        supabase.table("submissions").update({"product_url": clean_amazon_url}).eq("id", submission_id).execute()
    except Exception as e:
        logger.warning(f"[Submission ID: {submission_id}] Could not update clean URL: {e}")
        # Continue anyway as this is not fatal
        
    # Get RapidAPI configuration from environment
    rapidapi_key = os.environ.get('RAPIDAPI_KEY')
    rapidapi_host = os.environ.get('RAPIDAPI_HOST')

    if not rapidapi_key or not rapidapi_host:
        error_msg = "Missing required RapidAPI environment variables (KEY, HOST)"
        logger.error(f"[Submission ID: {submission_id}] {error_msg}")
        supabase.table("submissions").update({"status": "failed", "error_message": error_msg}).eq("id", submission_id).execute()
        return result
        
    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "x-rapidapi-key": rapidapi_key,
                "x-rapidapi-host": rapidapi_host
            }
            product_api_url = f"https://{rapidapi_host}/product-details"
            product_params = {
                "country": "US", # Or make dynamic if needed
                "asin": asin
            }

            # --- Fetch Product Details via RapidAPI --- 
            logger.info(f"[Submission ID: {submission_id}] Fetching product details from RapidAPI for ASIN: {asin}")
            async with session.get(product_api_url, headers=headers, params=product_params) as product_response:
                if product_response.status != 200:
                    error_text = await product_response.text()
                    logger.error(f"[Submission ID: {submission_id}] Failed to fetch RapidAPI product details: {product_response.status} - {error_text}")
                    # Optionally update submission status or continue to reviews?
                    # For now, we continue to try fetching reviews even if details fail
                else:
                    try:
                        product_data = await product_response.json()
                        logger.info(f"[Submission ID: {submission_id}] Successfully fetched RapidAPI product details.")
                        logger.debug(f"[Submission ID: {submission_id}] Raw Product Details API Response Keys: {list(product_data.keys())}")
                        
                        # Map API response to our product_details structure
                        # Extract data from the RapidAPI response - carefully follow the exact format we see in the database
                        api_data = product_data.get("data", {})
                        # Get manufacturer from product information if available
                        manufacturer = None
                        if api_data.get("product_information") and isinstance(api_data.get("product_information"), dict):
                            manufacturer = api_data.get("product_information", {}).get("Manufacturer")
                            
                        # Use the dedicated function to process the API response into database fields
                        # This gives us a clean separation between API fetching and database processing
                        logger.info(f"[Submission ID: {submission_id}] Processing product details using dedicated function")
                        
                        # Add the raw product_data to result first
                        result["raw_api_response"] = product_data
                        
                        # Process the API response to get database-ready fields
                        product_details = {"raw_api_response": product_data}  # Always include the raw response
                        
                        # Fallback to first extracting product title if needed
                        product_title = None
                        if api_data.get("product_title"):
                            product_title = api_data.get("product_title")
                            logger.info(f"[Submission ID: {submission_id}] Found product title in API data: {product_title}")
                        else:
                            logger.warning(f"[Submission ID: {submission_id}] No product title found in API data")
                        
                        # Add the product title to product_details
                        product_details["title"] = product_title
                        
                        result["product_details"] = product_details # Update result dict
                        logger.info(f"[Submission ID: {submission_id}] Parsed product details from API.")

                    except json.JSONDecodeError:
                        logger.error(f"[Submission ID: {submission_id}] Failed to decode JSON from RapidAPI product details response.")
                    except Exception as e:
                        logger.exception(f"[Submission ID: {submission_id}] Error processing RapidAPI product details response: {e}")

            # --- Fetch Reviews via RapidAPI --- 
            logger.info(f"[Submission ID: {submission_id}] Starting RapidAPI Amazon review collection for ASIN: {asin}")
            # Use the same host for reviews
            reviews_api_url = f"https://{rapidapi_host}/product-reviews"
            
            page_num = 1
            MAX_PAGES = 100 # Expanded to fetch up to 100 pages of reviews
            MAX_REVIEWS = 1000 # Limit total reviews to prevent excessive database usage
            RATE_LIMIT_RETRY_DELAY = 2.0 # seconds to wait if we hit a rate limit
            
            while page_num <= MAX_PAGES:
                review_params = {
                    "country": "US",
                    "asin": asin,
                    "page": str(page_num),
                    "sort_by": "MOST_RECENT", # Per documentation: TOP_REVIEWS or MOST_RECENT
                    "star_rating": "ALL", # ALL, 5_STARS, 4_STARS, 3_STARS, 2_STARS, 1_STARS, POSITIVE, CRITICAL
                    "verified_purchases_only": "false",
                    "images_or_videos_only": "false"
                }
                logger.info(f"[Submission ID: {submission_id}] Fetching reviews page {page_num}")
                async with session.get(reviews_api_url, headers=headers, params=review_params) as reviews_response:
                    if reviews_response.status != 200:
                        error_text = await reviews_response.text()
                        logger.error(f"[Submission ID: {submission_id}] Failed to fetch RapidAPI reviews page {page_num}: {reviews_response.status} - {error_text}")
                        break # Stop fetching reviews if a page fails

                    try:
                        reviews_data = await reviews_response.json()
                        logger.debug(f"[Submission ID: {submission_id}] Reviews Page {page_num} - Raw Keys: {list(reviews_data.keys())}")
                        
                        # Per RAPIDAPI_AMAZON_CONFIG.mdc, reviews are in data.reviews array
                        data = reviews_data.get("data", {})
                        page_reviews = data.get("reviews", [])
                        
                        # Log full response structure to help debug
                        logger.debug(f"[Submission ID: {submission_id}] Full Reviews Response: {json.dumps(reviews_data)[:1000]}...")
                        
                        if not page_reviews:
                            logger.info(f"[Submission ID: {submission_id}] No more reviews found on page {page_num}.")
                            break # Stop if no reviews on the page
                        
                        logger.info(f"[Submission ID: {submission_id}] Fetched {len(page_reviews)} reviews from page {page_num}.")
                        
                        # Process and format reviews before adding
                        for review in page_reviews:
                            # Check if we've reached the maximum review count
                            if len(reviews_list) >= MAX_REVIEWS:
                                logger.info(f"[Submission ID: {submission_id}] Reached maximum review count ({MAX_REVIEWS}). Stopping review collection.")
                                break
                            
                            # Update field mappings based on RAPIDAPI_AMAZON_CONFIG.mdc documentation
                            # Parse the review date from RapidAPI format - only use actual dates from the API
                            review_date = parse_amazon_review_date(review.get("review_date", ""))
                            
                            formatted_review = {
                                "submission_id": submission_id,
                                "review_id": review.get("review_id"),
                                "review_title": review.get("review_title"),
                                "review_text": review.get("review_comment"),
                                "review_rating": review.get("review_star_rating"),
                                "created_at": review_date,  # Use the parsed review date
                                "review_date": review_date,  # Also store it in the review_date field
                                "reviewer_name": review.get("review_author"),
                                "is_verified_purchase": review.get("is_verified_purchase", False),
                                "helpful_votes": extract_helpful_votes(review.get("helpful_vote_statement", "")),
                                "country": "US", # Default to US
                                "raw_data": json.dumps(review) # Store raw review data as JSON string
                            }
                            # Clean None values before adding
                            reviews_list.append({k:v for k,v in formatted_review.items() if v is not None})
                        
                        # Check if there's a next page based on pagination info (if API provides it)
                        # Example: if not reviews_data.get("pagination", {}).get("has_next_page"):
                        #     break
                        # For now, just rely on MAX_PAGES or empty review list
                        
                        # Exit loop if we've reached the max reviews
                        if len(reviews_list) >= MAX_REVIEWS:
                            logger.info(f"[Submission ID: {submission_id}] Reached maximum review count ({MAX_REVIEWS}). Stopping pagination.")
                            break
                            
                        page_num += 1

                    except json.JSONDecodeError:
                        logger.error(f"[Submission ID: {submission_id}] Failed to decode JSON from RapidAPI reviews response page {page_num}.")
                        break
                    except Exception as e:
                        logger.exception(f"[Submission ID: {submission_id}] Error processing RapidAPI reviews response page {page_num}: {e}")
                        break
                
                # Add delay between pages to prevent rate limiting
                await asyncio.sleep(0.5)  # 500ms delay between requests
            
            logger.info(f"[Submission ID: {submission_id}] Finished RapidAPI review collection. Total reviews fetched: {len(reviews_list)}")
            result["reviews"] = reviews_list # Update result dict
            
    except aiohttp.ClientError as e:
        logger.exception(f"[Submission ID: {submission_id}] Network error during RapidAPI scraping: {e}")
        supabase.table("submissions").update({"status": "failed", "error_message": f"Network error during scraping: {e}"}).eq("id", submission_id).execute()
    except Exception as e:
        logger.exception(f"[Submission ID: {submission_id}] Unexpected error during Amazon scraping: {e}")
        supabase.table("submissions").update({"status": "failed", "error_message": f"Unexpected error during scraping: {e}"}).eq("id", submission_id).execute()
        
    logger.info(f"[Submission ID: {submission_id}] Amazon scraping function finished. Returning details: {result['product_details'] is not None}, reviews: {len(result['reviews'])}")
    return result

# Helper function to extract price from various formats
def extract_price(price_str):
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

# Shopify scraping implementation
async def scrape_shopify_reviews(submission_id: str, url: str) -> Dict[str, Any]:
    """
    Asynchronously scrape Shopify product details and reviews
    
    Args:
        submission_id: The ID of the submission in Supabase
        url: The Shopify store URL to scrape
        
    Returns:
        Dictionary with product and reviews keys
    """
    logger.info(f"[Submission ID: {submission_id}] Starting Shopify scraping for URL: {url}")
    
    # Initialize results structure
    result = {
        "product": None,
        "reviews": []
    }
    
    try:
        # Create async session for HTTP requests
        async with aiohttp.ClientSession() as session:
            logger.info(f"[Submission ID: {submission_id}] Fetching Shopify product from {url}")
            
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9"
            }
            
            async with session.get(url, headers=headers) as response:
                if response.status != 200:
                    logger.error(f"[Submission ID: {submission_id}] Failed to fetch Shopify page: {response.status}")
                    return result
                    
                html_content = await response.text()
                soup = BeautifulSoup(html_content, 'html.parser')
                
                # Extract basic product details - simplified for demonstration
                product = {}
                
                # Look for product name in standard Shopify locations
                product_title = soup.select_one('.product-single__title')
                if product_title:
                    product['title'] = product_title.text.strip()
                else:
                    # Try alternate selectors used by some themes
                    alt_title = soup.select_one('h1.product_name') or soup.select_one('.product-title')
                    if alt_title:
                        product['title'] = alt_title.text.strip()
                
                # Try to find price
                price_elem = soup.select_one('.price__current') or soup.select_one('.product-single__price')
                if price_elem:
                    price_text = price_elem.text.strip()
                    product['price'] = extract_price(price_text)
                
                # For demo purposes: Create 5 sample reviews
                reviews = []
                for i in range(5):
                    reviews.append({
                        "review_text": f"This is a sample Shopify review #{i+1} for testing purposes.",
                        "review_rating": (i % 5) + 1,  # Rating 1-5
                        "review_date": (datetime.now() - timedelta(days=i*2)).isoformat(),
                        "submission_id": submission_id
                    })
                
                # Store the results
                result["product"] = product
                result["reviews"] = reviews
                
                # Save reviews to Supabase
                try:
                    for review in reviews:
                        supabase.table("reviews").insert(review).execute()
                    logger.info(f"[Submission ID: {submission_id}] Saved {len(reviews)} Shopify reviews to Supabase")
                except Exception as e:
                    logger.error(f"[Submission ID: {submission_id}] Failed to save Shopify reviews to Supabase: {str(e)}")
    
    except Exception as e:
        logger.error(f"[Submission ID: {submission_id}] Error in Shopify scraper: {str(e)}")
        # Return empty result structure on error
        
    return result

# --- Helper Function for Date Parsing ---
def parse_review_date(date_str: Optional[str]) -> Optional[str]:
    """Attempts to parse various date string formats into YYYY-MM-DD."""
    if not date_str:
        return None
    
    # Handle ISO format with time component first (e.g., '2024-07-19T00:00:00')
    iso_match = re.match(r'^(\d{4}-\d{2}-\d{2})T', date_str)
    if iso_match:
        # Just extract the date part from the ISO datetime
        return iso_match.group(1)
    
    # Extract the core date part (e.g., "September 18, 2024" from "Reviewed in ... on September 18, 2024")
    text_date_match = re.search(r'(\w+ \d{1,2}, \d{4})$', date_str)
    if text_date_match:
        date_part = text_date_match.group(1)
    else:
        date_part = date_str # Assume the string might already be in a parsable format

    # Common date formats to try
    formats_to_try = [
        "%B %d, %Y",  # September 18, 2024
        "%Y-%m-%d",  # 2024-09-18
        "%d/%m/%Y",  # 18/09/2024
        "%m/%d/%Y",  # 09/18/2024
        "%Y-%m-%dT%H:%M:%S",  # 2024-09-18T14:30:00
        "%Y-%m-%dT%H:%M:%S.%f",  # 2024-09-18T14:30:00.123456
        "%Y-%m-%d %H:%M:%S"  # 2024-09-18 14:30:00
    ]
    
    for fmt in formats_to_try:
        try:
            parsed_date = datetime.strptime(date_part, fmt)
            return parsed_date.strftime("%Y-%m-%d")
        except ValueError:
            continue
    
    # Final attempt with dateutil parser which handles many formats
    try:
        from dateutil import parser
        parsed_date = parser.parse(date_str)
        return parsed_date.strftime("%Y-%m-%d")
    except (ImportError, ValueError, TypeError) as e:
        logger.debug(f"dateutil parser failed: {e}")
            
    logger.warning(f"Could not parse date string: '{date_str}' with any known format.")
    return None

# --- Helper Function for Price Cleaning ---
def parse_price(price_str: Optional[str]) -> Optional[float]:
    """Attempts to parse a price string (e.g., '$204.00') into a float."""
    if not price_str or not isinstance(price_str, str):
        return None
    try:
        # Remove currency symbols, commas, and whitespace
        cleaned_price = re.sub(r'[$,\s£€]', '', price_str)
        return float(cleaned_price)
    except (ValueError, TypeError):
        logger.warning(f"Could not parse price string: '{price_str}'")
        return None

# --- Process RapidAPI Response into Database Fields ---
def process_product_api_response(submission_id: str, api_response: Dict) -> Dict:
    """
    Process the RapidAPI response into a format ready for Supabase database update.
    
    Args:
        submission_id: The submission ID for logging
        api_response: The raw API response from RapidAPI
        
    Returns:
        A dictionary with fields ready for Supabase update
    """
    logger.info(f"[Submission ID: {submission_id}] Processing API response into database fields")
    
    # Initialize the update data dictionary with None values
    db_fields = {
        "product_title": None,
        "brand_name": None,
        "category_name": None, 
        "product_overall_rating": None,
        "product_num_ratings": None,
        "price": None,
        "currency": None,
        "availability": None,
        "product_description": None,
        "product_url": None,
        "asin": None,
        "sales_volume": None,
        "is_best_seller": None,
        "is_amazon_choice": None,
        "is_prime": None,
        "climate_pledge_friendly": None,
        "product_features": None,
        "product_images": None, 
        "product_specifications": None,
        "product_details_misc": None,
        "product_variants": None,
        "api_response_product_details": None
    }
    
    # If API response is invalid, return empty fields
    if not api_response or "data" not in api_response:
        logger.warning(f"[Submission ID: {submission_id}] Invalid API response structure for processing")
        return db_fields
    
    # Store the full API response
    db_fields["api_response_product_details"] = json.dumps(api_response)
    
    # Extract the data section
    api_data = api_response.get("data", {})
    if not api_data:
        logger.warning(f"[Submission ID: {submission_id}] Empty data section in API response")
        return db_fields
    
    # Extract product title
    db_fields["product_title"] = api_data.get("product_title")
    if db_fields["product_title"]:
        logger.info(f"[Submission ID: {submission_id}] Extracted product title: {db_fields['product_title']}")
    else:
        logger.warning(f"[Submission ID: {submission_id}] No product title found in API response")
    
    # Extract brand name from product_information
    product_info = api_data.get("product_information", {})
    if product_info and isinstance(product_info, dict):
        db_fields["brand_name"] = product_info.get("Manufacturer")
        
        # Extract category from Best Sellers Rank
        best_sellers_rank = product_info.get("Best Sellers Rank", "")
        if best_sellers_rank:
            category_match = re.search(r'in ([^(]+)', best_sellers_rank)
            if category_match:
                db_fields["category_name"] = category_match.group(1).strip()
                logger.info(f"[Submission ID: {submission_id}] Extracted category: {db_fields['category_name']}")
    
    # If no brand found, use a default
    if not db_fields["brand_name"]:
        # Try to extract from title if available
        if db_fields["product_title"]:
            title_words = db_fields["product_title"].split()
            if title_words:
                db_fields["brand_name"] = title_words[0]
                logger.info(f"[Submission ID: {submission_id}] Using first word of title as brand: {db_fields['brand_name']}")
    
    # If no category found, use a default
    if not db_fields["category_name"]:
        db_fields["category_name"] = "Beauty & Personal Care"  # Default category
    
    # Extract numeric and boolean fields
    try:
        # Rating
        if api_data.get("product_star_rating"):
            db_fields["product_overall_rating"] = float(api_data.get("product_star_rating"))
        
        # Number of ratings
        if api_data.get("product_num_ratings"):
            db_fields["product_num_ratings"] = int(api_data.get("product_num_ratings"))
        
        # Price
        if api_data.get("product_price"):
            db_fields["price"] = parse_price(api_data.get("product_price"))
        
        # Boolean fields
        db_fields["is_best_seller"] = bool(api_data.get("is_best_seller"))
        db_fields["is_amazon_choice"] = bool(api_data.get("is_amazon_choice"))
        db_fields["is_prime"] = bool(api_data.get("is_prime"))
        db_fields["climate_pledge_friendly"] = bool(api_data.get("climate_pledge_friendly"))
    except (ValueError, TypeError) as e:
        logger.warning(f"[Submission ID: {submission_id}] Error processing numeric/boolean fields: {e}")
    
    # Extract simple string fields
    db_fields["currency"] = api_data.get("currency")
    db_fields["availability"] = api_data.get("product_availability")
    db_fields["product_description"] = api_data.get("product_description")
    db_fields["product_url"] = api_data.get("product_url")
    db_fields["asin"] = api_data.get("asin")
    db_fields["sales_volume"] = api_data.get("sales_volume")
    
    # Extract and serialize complex fields
    db_fields["product_features"] = json.dumps(api_data.get("about_product", [])) 
    db_fields["product_images"] = json.dumps(api_data.get("product_photos", []))
    db_fields["product_specifications"] = json.dumps(product_info) if product_info else json.dumps({})
    
    # Store additional data in product_details_misc
    misc_data = {
        "rating_distribution": api_data.get("rating_distribution", {}),
        "product_videos": api_data.get("product_videos", []),
        "user_uploaded_videos": api_data.get("user_uploaded_videos", [])
    }
    db_fields["product_details_misc"] = json.dumps(misc_data)
    
    # Log success
    logger.info(f"[Submission ID: {submission_id}] Successfully processed API response into {len([v for v in db_fields.values() if v is not None])} database fields")
    
    return db_fields

@app.task(name='worker.scrape_reviews')
def scrape_reviews(submission_id: str, url: str) -> Dict[str, str]:
    """Scrape reviews from a URL and update the submission in the database."""
    logger.info(f"Running scrape_reviews task for submission ID: {submission_id} with URL: {url}")
    
    # Initialize the result dictionary that will be returned by this task
    result = {
        "status": "started",
        "message": f"Processing submission {submission_id}",
        "database_update_success": False,
        "reviews_count": 0,
        "database_update": {},
        "error": None
    }
    
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
            result["error"] = "Unsupported platform"
            
        # --- Process API Response and Update Supabase ---
        # Always run this section if product_details exists
        if product_details:
            try:
                # Process the API response into database-ready fields
                logger.info(f"[Submission ID: {submission_id}] Processing API response for database update")
                
                # Extract the raw API response
                raw_api_response = product_details.get("raw_api_response", {})
                
                # Use our dedicated function to extract fields from API response
                db_fields = process_product_api_response(submission_id, raw_api_response)
                
                # Get the current submission data to preserve existing fields
                submission_response = supabase.table("submissions").select("is_competitor_product").eq("id", submission_id).execute()
                is_competitor = False
                if submission_response and hasattr(submission_response, 'data') and len(submission_response.data) > 0:
                    is_competitor = bool(submission_response.data[0].get("is_competitor_product", False))
                    logger.info(f"[Submission ID: {submission_id}] Retrieved is_competitor_product value: {is_competitor}")
                
                # Add a few additional fields not set by the processor
                db_fields.update({
                    "last_refreshed_at": datetime.utcnow().isoformat(),
                    "display_name": db_fields.get("product_title"),  # Set display name to product title
                    "is_competitor_product": is_competitor,  # Use the actual value from the database
                    "status": "details_fetched"
                })
                
                # Log key information for debugging
                logger.info(f"[Submission ID: {submission_id}] Processed fields - Title: {db_fields.get('product_title')}, "  
                           f"Brand: {db_fields.get('brand_name')}, Category: {db_fields.get('category_name')}")
                logger.info(f"[Submission ID: {submission_id}] Processed fields - Rating: {db_fields.get('product_overall_rating')}, "  
                           f"Price: {db_fields.get('price')}, Num Ratings: {db_fields.get('product_num_ratings')}")
                
                # Log all fields that will be updated
                fields_to_update = [k for k, v in db_fields.items() if v is not None]
                logger.info(f"[Submission ID: {submission_id}] Fields to update: {fields_to_update}")
                
                # Group fields by type (to avoid SQL size limits and for better error handling)
                essential_fields = {k: v for k, v in db_fields.items() if k in [
                    "product_title", "brand_name", "category_name", "asin", "product_url", "display_name", "status", "last_refreshed_at"
                ] and v is not None}
                
                numeric_fields = {k: v for k, v in db_fields.items() if k in [
                    "product_overall_rating", "product_num_ratings", "price"
                ] and v is not None}
                
                boolean_fields = {k: v for k, v in db_fields.items() if k in [
                    "is_best_seller", "is_amazon_choice", "is_prime", "climate_pledge_friendly", "is_competitor_product"
                ] and v is not None}
                
                text_fields = {k: v for k, v in db_fields.items() if k in [
                    "currency", "availability", "product_description", "sales_volume"
                ] and v is not None}
                
                jsonb_fields = {k: v for k, v in db_fields.items() if k in [
                    "product_features", "product_images", "product_specifications", "product_details_misc", "product_variants", "api_response_product_details"
                ] and v is not None}
                
                # Update each batch separately with detailed logging
                update_results = {}
                
                # Update essential fields first (these identify the product)
                if essential_fields:
                    logger.info(f"[Submission ID: {submission_id}] Updating essential fields: {list(essential_fields.keys())}")
                    response = supabase.table("submissions").update(essential_fields).eq("id", submission_id).execute()
                    update_results["essential"] = len(response.data) > 0
                    logger.info(f"[Submission ID: {submission_id}] Essential fields update success: {update_results['essential']}")
                
                # Update numeric fields
                if numeric_fields:
                    logger.info(f"[Submission ID: {submission_id}] Updating numeric fields: {list(numeric_fields.keys())}")
                    response = supabase.table("submissions").update(numeric_fields).eq("id", submission_id).execute()
                    update_results["numeric"] = len(response.data) > 0
                    logger.info(f"[Submission ID: {submission_id}] Numeric fields update success: {update_results['numeric']}")
                
                # Update boolean fields
                if boolean_fields:
                    logger.info(f"[Submission ID: {submission_id}] Updating boolean fields: {list(boolean_fields.keys())}")
                    response = supabase.table("submissions").update(boolean_fields).eq("id", submission_id).execute()
                    update_results["boolean"] = len(response.data) > 0
                    logger.info(f"[Submission ID: {submission_id}] Boolean fields update success: {update_results['boolean']}")
                
                # Update text fields
                if text_fields:
                    logger.info(f"[Submission ID: {submission_id}] Updating text fields: {list(text_fields.keys())}")
                    response = supabase.table("submissions").update(text_fields).eq("id", submission_id).execute()
                    update_results["text"] = len(response.data) > 0
                    logger.info(f"[Submission ID: {submission_id}] Text fields update success: {update_results['text']}")
                
                # Update JSONB fields one by one to prevent size issues
                if jsonb_fields:
                    update_results["jsonb"] = {}
                    for field, value in jsonb_fields.items():
                        if field == "api_response_product_details":
                            logger.info(f"[Submission ID: {submission_id}] Updating API response (size: {len(value)} characters)")
                        else:
                            logger.info(f"[Submission ID: {submission_id}] Updating JSONB field: {field}")
                            
                        field_update = {field: value}
                        response = supabase.table("submissions").update(field_update).eq("id", submission_id).execute()
                        update_results["jsonb"][field] = len(response.data) > 0
                        logger.info(f"[Submission ID: {submission_id}] {field} update success: {update_results['jsonb'][field]}")
                
                # Add update results to the return value
                result["database_update"] = update_results
                result["database_update_success"] = True
                logger.info(f"[Submission ID: {submission_id}] Successfully updated database with product details")
                
            except Exception as e:
                logger.error(f"[Submission ID: {submission_id}] Error updating database with product details: {str(e)}")
                result["database_update_success"] = False
                result["database_update_error"] = str(e)
                result["status"] = "error"
                    
                # Explicit update of display_name as a separate operation to ensure it's set
                if product_title:
                    display_name_update = supabase.table("submissions").update({"display_name": product_title}).eq("id", submission_id).execute()
                    logger.info(f"[Submission ID: {submission_id}] Updated display_name separately: {product_title}")
                    
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
            # Even though we have no reviews, pass the submission_id to the next task
            return {'submission_id': submission_id}

        successful_inserts = 0
        failed_inserts = 0
        review_count = 0  # Initialize review counter
        logger.info(f"[Submission ID: {submission_id}] Starting insertion of {len(reviews_list)} reviews.")

        for review in reviews_list:
            try:
                # Extract and process review-specific data
                review_rating_str = review.get("review_rating")
                review_rating = float(review_rating_str) if review_rating_str is not None else None

                review_date_str = review.get("review_date")
                review_date = parse_review_date(review_date_str) # Use helper

                # Before creating review_data, log raw review objects to debug the issue
                logger.debug(f"[Submission ID: {submission_id}] RAW REVIEW OBJECT KEYS: {list(review.keys())}")
                if 'review_text' in review:
                    logger.debug(f"[Submission ID: {submission_id}] RAW review_text: '{review.get('review_text')[:100]}...'")
                if 'review_comment' in review:
                    logger.debug(f"[Submission ID: {submission_id}] RAW review_comment: '{review.get('review_comment')[:100]}...'")
                
                # CRITICAL FIX: Simplify the logic for review_text extraction to avoid conditional issues
                review_text = None
                if review.get("review_text"):
                    review_text = review["review_text"].strip()
                elif review.get("review_comment"):
                    review_text = review["review_comment"].strip()
                
                review_data = {
                    "submission_id": submission_id,
                    # --- Review Specific Fields ---
                    "review_text": review_text,
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
                
                # ENHANCED DEBUGGING: Log every review's text fields before insertion
                logger.debug(f"[Submission ID: {submission_id}] PRE-INSERT REVIEW #{review_count}: DATA KEYS = {list(review_data.keys())}")
                if 'review_text' in review_data:
                    logger.debug(f"[Submission ID: {submission_id}] PRE-INSERT REVIEW #{review_count}: review_text = '{review_data['review_text'][:100] if review_data['review_text'] else 'EMPTY'}...'")
                else:
                    logger.debug(f"[Submission ID: {submission_id}] PRE-INSERT REVIEW #{review_count}: NO review_text field!")
                    
                # For debugging - ensure review_text is actually being passed
                if review.get("review_comment") and not review_data["review_text"]:
                    logger.warning(f"[Submission ID: {submission_id}] review_comment exists but review_text is empty: {review.get('review_comment')[:30]}...")

                # Remove None values before insertion
                review_data_cleaned = {k: v for k, v in review_data.items() if v is not None}

                # Log sample of the data being inserted (first review only)
                # if successful_inserts == 0:
                #    logger.debug(f"[Submission ID: {submission_id}] Sample review data for insertion: {json.dumps(review_data_cleaned, default=str)}")
                
                # Log data for first 5 inserts for debugging
                if successful_inserts < 5:
                    logger.debug(f"[Submission ID: {submission_id}] Inserting review #{successful_inserts + 1} data: {json.dumps(review_data_cleaned, default=str)}")

                # Execute insert
                insert_response = supabase.table("reviews").insert(review_data_cleaned).execute()

                # Check for errors in insert response if the API provides detailed errors
                if hasattr(insert_response, 'error') and insert_response.error:
                   logger.error(f"[Submission ID: {submission_id}] Supabase insert error: {insert_response.error.message}")
                   failed_inserts += 1
                   continue # Skip to next review

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
        supabase.table('submissions').update({'status': final_status, 'last_refreshed_at': datetime.utcnow().isoformat()}).eq('id', submission_id).execute()

        logger.info(f"[Submission ID: {submission_id}] Task finished.")
        
        # Update the result with final status
        result.update({
            "status": "completed",
            "reviews_count": successful_inserts,
            "message": f"Successfully processed {successful_inserts} reviews for submission {submission_id}"
        })
        return result

    except Exception as e:
        logger.exception(f"[Submission ID: {submission_id}] Unhandled error in scrape_reviews task: {str(e)}")
        
        # Update result with error information
        result.update({
            "status": "error",
            "error": str(e),
            "message": f"Failed to process submission {submission_id}",
            "database_update_success": False
        })
        
        # Update status to indicate failure
        try:
            supabase.table("submissions").update({"status": "error", "error_message": str(e)[:500]}).eq("id", submission_id).execute()
        except Exception as update_error:
            logger.error(f"[Submission ID: {submission_id}] Failed to update error status: {update_error}")
        
        # Return the result with error info instead of re-raising
        return result

@app.task(name='worker.analyze_reviews')
def analyze_reviews(result, submission_id: str = None):
    """Fetches reviews for a submission, analyzes them, and updates the analyses table."""
    # Extract submission_id from the result of the previous task if provided
    if isinstance(result, dict) and 'submission_id' in result:
        submission_id = result.get('submission_id')
    # If no submission_id from previous task and none provided as direct parameter
    if not submission_id:
        logger.error("[Analyze Task] No submission_id provided. Cannot proceed with analysis.")
        return {'status': 'failed', 'message': 'No submission_id provided'}
    try:
        logger.info(f"[Analyze Task - Submission ID: {submission_id}] Starting analysis.")
        # Fetch submission details including product title
        submission_response = supabase.table('submissions').select('id, product_title, status').eq('id', submission_id).single().execute()
        if hasattr(submission_response, 'error') and submission_response.error:
             logger.error(f"[Analyze Task - Submission ID: {submission_id}] Error fetching submission: {submission_response.error}")
             return {'status': 'failed', 'message': f'Error fetching submission: {submission_response.error}'}
        if not submission_response.data:
            logger.error(f"[Analyze Task - Submission ID: {submission_id}] Submission not found.")
            return {'status': 'failed', 'message': 'Submission not found'}
            
        submission_data = submission_response.data
        original_product_title = submission_data.get('product_title', 'Unknown Product') # Get product title
        logger.info(f"[Analyze Task - Submission ID: {submission_id}] Original Product Title: {original_product_title}")

        # Update submission status to 'processing_analysis'
        status_update_response = supabase.table('submissions').update({'status': 'processing_analysis'}).eq('id', submission_id).execute()

        # Fetch reviews from database - select text, rating, and date
        reviews_response = supabase.table('reviews').select('review_text, review_rating, review_date, created_at').eq('submission_id', submission_id).execute()

        if not reviews_response.data:
             logger.warning(f"[Analyze Task - Submission ID: {submission_id}] No reviews found in DB for analysis.")
             return {'status': 'skipped', 'message': 'No reviews found for analysis'}

        reviews_data_for_prompt = reviews_response.data

        if not reviews_data_for_prompt:
            logger.warning(f"[Analyze Task - Submission ID: {submission_id}] No review data available for prompt generation.")
            return {'status': 'skipped', 'message': 'No review data available'}

        # --- Calculate core metrics locally --- 
        total_rating = 0.0
        rating_count = 0
        local_rating_distribution = defaultdict(int)
        valid_ratings_list = []

        for review in reviews_data_for_prompt:
            rating_str = review.get('review_rating')
            if rating_str is not None:
                try:
                    rating = float(rating_str) # Convert rating string to float
                    if 1.0 <= rating <= 5.0:
                        valid_ratings_list.append(rating)
                        rating_key = int(rating) # Use int for distribution keys
                        local_rating_distribution[rating_key] += 1
                        rating_count += 1
                except (ValueError, TypeError):
                    logger.warning(f"[Analyze Task - Submission ID: {submission_id}] Skipping invalid rating format: {rating_str}")

        local_average_rating = statistics.mean(valid_ratings_list) if valid_ratings_list else 0.0
        logger.info(f"[Analyze Task - Submission ID: {submission_id}] Locally calculated average rating: {local_average_rating:.2f}, Distribution: {dict(local_rating_distribution)}")

        # --- Calculate ratings over time locally (existing logic) ---
        # (Keep the existing logic for month_ratings calculation here)
        # Calculate ratings over time (monthly averages with review counts)
        month_ratings = defaultdict(list)
        for review in reviews_data_for_prompt:
            # Use review_date (when the review was posted on Amazon)
            # Do not fall back to created_at as it doesn't represent the actual review date
            date_str = review.get('review_date', '')
            rating_str = review.get('review_rating')
            
            # Skip reviews without valid rating
            if rating_str is None:
                continue
                
            try:
                # Only include valid ratings between 1-5
                rating = float(rating_str)
                if 1.0 <= rating <= 5.0:
                    # Skip reviews that still have no valid date even after fallback
                    if not date_str or not date_str.strip():
                        logger.debug(f"Skipping rating for monthly average: no valid date available")
                        continue
                        
                    try:
                        # Try to parse ISO format (2024-05-05T14:30:00)
                        if 'T' in date_str:
                            dt = datetime.fromisoformat(date_str.split('.')[0])
                            month_key = dt.strftime('%Y-%m')
                            month_ratings[month_key].append(rating)
                            
                        # Try to parse YYYY-MM-DD format
                        elif '-' in date_str and len(date_str.split('-')) == 3:
                            try:
                                dt = datetime.strptime(date_str.strip(), '%Y-%m-%d')
                                month_key = dt.strftime('%Y-%m')
                                month_ratings[month_key].append(rating)
                            except ValueError as e:
                                logger.debug(f"Skipping unparseable date for monthly average: '{date_str}'. Error: {e}")
                                continue
                        
                        # Only use dateutil parser as last resort
                        else:
                            try:
                                from dateutil import parser
                                dt = parser.parse(date_str)
                                month_key = dt.strftime('%Y-%m')
                                month_ratings[month_key].append(rating)
                            except Exception as e:
                                logger.debug(f"Failed to parse date with dateutil for monthly average: '{date_str}'. Error: {e}")
                                continue
                    except Exception as e:
                        logger.debug(f"Skipping review for monthly average due to date parsing error: '{date_str}'. Error: {e}")
                        continue
            except (ValueError, TypeError) as e:
                # Skip review if rating or date is invalid/missing
                logger.warning(f"[Analyze Task - Submission ID: {submission_id}] Skipping review for monthly calc due to invalid data: rating='{rating_str}', date='{date_str}'. Error: {e}")
                continue
        
        # Enhanced data structure: include both average rating and count for each month
        monthly_ratings_with_counts = {}
        for month, ratings in month_ratings.items():
            if ratings:  # Only include months with valid ratings
                monthly_ratings_with_counts[month] = {
                    "average": round(statistics.mean(ratings), 2),
                    "count": len(ratings)
                }
        
        # Sort months by date (newest first) and limit to last 12 months if there are more
        sorted_months = sorted(monthly_ratings_with_counts.keys(), reverse=True)
        if len(sorted_months) > 12:
            sorted_months = sorted_months[:12]
            # Create new dict with only the last 12 months
            limited_monthly_ratings = {}
            for month in sorted_months:
                limited_monthly_ratings[month] = monthly_ratings_with_counts[month]
            monthly_ratings_with_counts = limited_monthly_ratings
        
        logger.info(f"[Analyze Task - Submission ID: {submission_id}] Locally calculated monthly data: {monthly_ratings_with_counts}")
        
        # For backwards compatibility, also create the old format
        local_monthly_avg_ratings = {
            month: data["average"] 
            for month, data in monthly_ratings_with_counts.items()
        }
        # --- End existing ratings_over_time logic ---

        # --- Prepare Input for DeepSeek --- 
        logger.info(f"[Analyze Task - Submission ID: {submission_id}] Preparing analysis input for DeepSeek.")
        analysis_input = {
            'original_product_name': original_product_title, # Pass original name
            'reviews': reviews_data_for_prompt, # Pass raw review data
            'calculated_average_rating': round(local_average_rating, 2), # Pass calculated average
            'calculated_distribution': dict(local_rating_distribution), # Pass calculated distribution
            'calculated_monthly_averages': local_monthly_avg_ratings # Pass calculated monthly averages
        }

        # --- Trigger DeepSeek Analysis ---
        logger.info(f"[Analyze Task - Submission ID: {submission_id}] Triggering analysis.")
        api_key = os.getenv('DEEPSEEK_API_KEY')
        if not api_key:
            logger.error(f"[Analyze Task - Submission ID: {submission_id}] DeepSeek API key not found in environment variables.")
            # Update submission status to failed
            supabase.table('submissions').update({'status': 'Failed'}).eq('id', submission_id).execute()
            return {'status': 'failed', 'message': 'DeepSeek API key missing'}

        deepseek_response = call_deepseek_api(analysis_input, api_key)

        if 'error' in deepseek_response:
            error_message = deepseek_response['error']
            logger.error(f"[Analyze Task - Submission ID: {submission_id}] DeepSeek API call failed: {error_message}")
            # Update submission status to failed
            supabase.table('submissions').update({'status': 'Failed'}).eq('id', submission_id).execute()
            return {'status': 'failed', 'message': f'DeepSeek API Error: {error_message}'}

        logger.info(f"[Analyze Task - Submission ID: {submission_id}] Processing DeepSeek response.")
        processed_analysis = process_deepseek_response(deepseek_response)

        if 'error' in processed_analysis:
             # If processing failed, log it and mark as failed.
             process_error = processed_analysis['error']
             logger.error(f"[Analyze Task - Submission ID: {submission_id}] Failed to process DeepSeek response: {process_error}")
             supabase.table('submissions').update({'status': 'Failed'}).eq('id', submission_id).execute()
             return {'status': 'failed', 'message': f'Analysis Processing Error: {process_error}'}


        # --- Store Analysis Results in Supabase ---
        logger.info(f"[Analyze Task - Submission ID: {submission_id}] Storing analysis results in Supabase.")
        # Map fields to match the actual database schema per SUPABASE_DATABASE_SCHEMA.mdc
        analysis_data_to_insert = {
            'submission_id': submission_id,
            'sentiment_positive_score': processed_analysis.get('sentiment_positive_score'),
            'sentiment_negative_score': processed_analysis.get('sentiment_negative_score'),
            'sentiment_neutral_score': processed_analysis.get('sentiment_neutral_score'),
            'key_themes': json.dumps(processed_analysis.get('themes', [])),  # Changed 'themes' to 'key_themes'
            'top_positives': json.dumps(processed_analysis.get('top_positives', [])), 
            'top_negatives': json.dumps(processed_analysis.get('top_negatives', [])), 
            'word_map': json.dumps(processed_analysis.get('word_map', {})), 
            'trending': processed_analysis.get('trending'),
            'competitive_insights': json.dumps(processed_analysis.get('competitive_insights', [])), 
            'opportunities': json.dumps(processed_analysis.get('improvement_opportunities', [])),  # Using correct field name 'opportunities'
            'summary': processed_analysis.get('high_level_summary'),  # Using correct field name 'summary'
            'display_name': processed_analysis.get('display_name'),  # Add the display_name field from DeepSeek
            'created_at': datetime.now().isoformat(),
             # Add locally calculated data
             'average_rating': local_average_rating,
             'rating_distribution': json.dumps(dict(local_rating_distribution)), 
             'ratings_over_time': json.dumps(monthly_ratings_with_counts), 
             'review_count': rating_count
        }

        try:
            insert_response = supabase.table('analyses').insert(analysis_data_to_insert).execute()
            # Check for errors specifically in the response data or attributes
            if hasattr(insert_response, 'data') and insert_response.data:
                 logger.info(f"[Analyze Task - Submission ID: {submission_id}] Successfully inserted analysis results.")
            elif hasattr(insert_response, 'error') and insert_response.error:
                 logger.error(f"[Analyze Task - Submission ID: {submission_id}] Failed to insert analysis into Supabase: {insert_response.error}")
                 supabase.table('submissions').update({'status': 'Failed'}).eq('id', submission_id).execute()
                 return {'status': 'failed', 'message': 'Failed to store analysis results'}
            else:
                # Handle unexpected response structure
                logger.error(f"[Analyze Task - Submission ID: {submission_id}] Unexpected response structure from Supabase insert: {insert_response}")
                supabase.table('submissions').update({'status': 'Failed'}).eq('id', submission_id).execute()
                return {'status': 'failed', 'message': 'Failed to store analysis results due to unexpected DB response'}

        except Exception as db_exc:
            logger.exception(f"[Analyze Task - Submission ID: {submission_id}] Unexpected error inserting analysis into Supabase: {db_exc}")
            supabase.table('submissions').update({'status': 'Failed'}).eq('id', submission_id).execute()
            return {'status': 'failed', 'message': 'Unexpected error storing analysis results'}


        # --- Update Submission Status to Completed ---
        logger.info(f"[Analyze Task - Submission ID: {submission_id}] Updating submission status to 'Completed'.")
        update_response = supabase.table('submissions').update({'status': 'Completed', 'last_refreshed_at': datetime.now().isoformat()}).eq('id', submission_id).execute()

        if hasattr(update_response, 'error') and update_response.error:
            logger.error(f"[Analyze Task - Submission ID: {submission_id}] Failed to update submission status to Completed: {update_response.error}")
            return {'status': 'completed_with_warning', 'message': 'Analysis done, but failed to update final submission status'}
        else:
             logger.info(f"[Analyze Task - Submission ID: {submission_id}] Analysis task finished successfully.")
             return {'status': 'completed', 'submission_id': submission_id}

    except Exception as e:
        logger.exception(f"[Analyze Task - Submission ID: {submission_id}] An unexpected error occurred in analyze_reviews: {e}")
        # Ensure submission status reflects failure
        try:
            supabase.table('submissions').update({'status': 'Failed'}).eq('id', submission_id).execute()
        except Exception as final_update_err:
             logger.error(f"[Analyze Task - Submission ID: {submission_id}] Failed to update submission status to Failed after task error: {final_update_err}")
        return {'status': 'failed', 'message': f'Unexpected error: {e}'}

def process_deepseek_response(response_json: Dict) -> Dict[str, Any]:
    """
    Processes the raw JSON response from DeepSeek API.
    Extracts ONLY the specifically requested fields based on the refined prompt.
    Provides defaults or logs warnings if expected fields are missing.
    """
    logger.debug(f"Processing DeepSeek response. Raw keys: {list(response_json.keys())}")

    # Define the exact keys we expect based on the refined prompt (with new sentiment breakdown)
    expected_keys_from_api = [
        "sentiment_positive_score", # New
        "sentiment_negative_score", # New
        "sentiment_neutral_score",  # New
        "themes",
        "top_positives",
        "top_negatives",
        "word_map",
        "trending",
        "competitive_insights",
        "improvement_opportunities",
        "high_level_summary",
        "display_name"  # Add this field for dashboard-friendly product names
    ]

    processed = {}

    # Check if the response is nested (e.g., under 'product_analysis')
    if "product_analysis" in response_json and isinstance(response_json["product_analysis"], dict):
        data = response_json["product_analysis"]
        logger.debug("Found analysis data nested under 'product_analysis'.")
    else:
        data = response_json # Assume top-level structure

    # Iterate through ONLY the expected keys and extract them
    for key in expected_keys_from_api:
        if key in ["sentiment_positive_score", "sentiment_negative_score", "sentiment_neutral_score"]:
             # Ensure these are floats/numbers
             value = data.get(key)
             processed[key] = value if isinstance(value, (float, int)) else None
             if key in data and not isinstance(value, (float, int)):
                  logger.warning(f"Expected number for '{key}' but got {type(value)}. Using None.")
        elif key in ["themes", "top_positives", "top_negatives", "competitive_insights", "improvement_opportunities"]:
            # Ensure these are lists
            value = data.get(key)
            processed[key] = value if isinstance(value, list) else []
            if not isinstance(value, list):
                 logger.warning(f"Expected list for '{key}' but got {type(value)}. Using default [].")
        elif key == "word_map":
            # Ensure this is a dict
            value = data.get(key)
            processed[key] = value if isinstance(value, dict) else {}
            if not isinstance(value, dict):
                 logger.warning(f"Expected dict for '{key}' but got {type(value)}. Using default {{}}.")
        elif key == "trending":
            # Expecting a string
            value = data.get(key)
            processed[key] = value if isinstance(value, str) else None
            if key in data and not isinstance(value, str):
                 logger.warning(f"Expected string for '{key}' but got {type(value)}. Using None.")
        elif key == "high_level_summary":
            # Expecting a string
            value = data.get(key)
            processed[key] = value if isinstance(value, str) else None
            if key in data and not isinstance(value, str):
                 logger.warning(f"Expected string for '{key}' but got {type(value)}. Using None.")
        else:
             # Fallback for any other explicitly expected keys (currently none)
             processed[key] = data.get(key)

        # Log if an expected key was entirely missing from the source data
        if key not in data:
            logger.warning(f"Expected field '{key}' not found in DeepSeek response data.")

    # Log any unexpected keys found in the response data for monitoring
    unexpected_keys = [k for k in data.keys() if k not in expected_keys_from_api]
    if unexpected_keys:
        logger.warning(f"DeepSeek response included unexpected keys: {unexpected_keys}")

    logger.debug(f"Processed DeepSeek response keys (strict extraction): {list(processed.keys())}")
    return processed


def call_deepseek_api(analysis_input: Dict[str, Any], api_key: str) -> Dict:
    """
    Calls the DeepSeek API (or compatible OpenAI API endpoint) to analyze product reviews.

    Args:
        analysis_input (Dict): Dictionary containing review data and locally calculated metrics:
            - 'original_product_name': The full product title from the submission (str).
            - 'reviews': List of raw review dictionaries.
            - 'calculated_average_rating': Locally calculated average rating (float).
            - 'calculated_distribution': Locally calculated rating distribution (dict).
        api_key (str): The DeepSeek API key.

    Returns:
        Dict: The JSON response from the API, or an error dictionary.
    """
    if not api_key:
        logger.error("DeepSeek API key is missing.")
        return {"error": "API key not configured"}

    # Check if we actually have reviews to analyze
    reviews = analysis_input.get('reviews', [])
    original_product_title = analysis_input.get('original_product_name', 'Product') # Get original title
    
    if not reviews:
        logger.warning("No reviews provided for DeepSeek analysis")
        return {
            "sentiment_positive_score": None,
            "sentiment_negative_score": None,
            "sentiment_neutral_score": None,
            "themes": [],
            "top_positives": [],
            "top_negatives": [],
            "word_map": {},
            "trending": "Not enough data for analysis.",
            "competitive_insights": [],
            "improvement_opportunities": [],
            "high_level_summary": "Insufficient data for summary."
        }

    # Join the review texts together with newlines for the prompt
    review_texts_for_prompt = []
    for r in reviews:
        # Skip None values
        if not isinstance(r, dict):
            continue
            
        rating = r.get('review_rating', 'N/A')
        date = r.get('created_at', 'N/A')
        text = r.get('review_text', '')
        if text:
            # Truncate individual reviews to 200 chars
            text = text[:200]
            
        review_texts_for_prompt.append(f"Rating: {rating}, Date: {date}, Text: {text}")

    # Maximum number of characters in the review text section of prompt
    MAX_REVIEW_CHARS = 50000
    
    # Join all review texts with newlines
    prompt_review_text = "\n".join(review_texts_for_prompt)
    
    # Truncate if necessary
    if len(prompt_review_text) > MAX_REVIEW_CHARS:
        prompt_review_text = prompt_review_text[:MAX_REVIEW_CHARS] + "\n... (truncated)"
        logger.warning("Review text truncated for DeepSeek prompt due to length.")

    logger.info(f"Processed {len(review_texts_for_prompt)} reviews for analysis")

    # Construct the refined prompt incorporating local calculations and stricter output format
    prompt = f"""
TASK: Analyze product reviews for key insights and generate a concise display name.

PRODUCT CONTEXT:
- Original Product Name: {original_product_title}

REVIEW DATA:
a. You are provided with pre-calculated metrics; use them as context and focus ONLY on the qualitative insights requested below.

**Contextual Metrics (PROVIDED FOR CONTEXT - DO NOT RECALCULATE OR INCLUDE IN RESPONSE):**
- Average Rating: {analysis_input.get('calculated_average_rating', 'N/A')}
- Rating Distribution (Star: Count): {analysis_input.get('calculated_distribution', 'N/A')}
- Monthly Average Ratings ({len(analysis_input.get('calculated_monthly_averages', {}))} months): {analysis_input.get('calculated_monthly_averages', 'N/A')}

**Review Data Snippets:**
--- Start Review Data ---
{prompt_review_text}
--- End Review Data ---

**Analysis Tasks & REQUIRED JSON Output Structure:**

You MUST return ONLY a single, valid JSON object containing EXACTLY the following keys and value types. The sentiment scores MUST sum precisely to 1.0. DO NOT include any other keys or introductory text.

1.  `"sentiment_positive_score"`: (Float) Proportion of positive sentiment (0.0-1.0) based ONLY on review texts.
2.  `"sentiment_negative_score"`: (Float) Proportion of negative sentiment (0.0-1.0) based ONLY on review texts.
3.  `"sentiment_neutral_score"`: (Float) Proportion of neutral sentiment (0.0-1.0) based ONLY on review texts.
    *Constraint: sentiment_positive_score + sentiment_negative_score + sentiment_neutral_score MUST equal 1.0.*
4.  `"themes"`: (List of Strings, max 10) Main themes discussed (e.g., "Customer Service", "Battery Life").
5.  `"top_positives"`: (List of Strings, max 5) Top positive points mentioned in text.
6.  `"top_negatives"`: (List of Strings, max 5) Top negative points mentioned in text. Briefly explain any major discrepancies between sentiment/ratings if observed.
7.  `"word_map"`: (Dictionary Object, max 50 key-value pairs) Most frequent meaningful words (exclude common stop words) and their counts.
8.  `"trending"`: (String) Analysis of *reasons* for rating changes over time, based on Monthly Average Ratings and review text themes.
9.  `"improvement_opportunities"`: (List of Strings, max 5) Concrete suggestions for product improvements based on the negative feedback and themes.
10. `"competitive_insights"`: (List of Strings, max 5) Insights comparing this product to competitors *if explicitly mentioned* in the reviews, or potential competitive advantages/disadvantages identified.
11. `"high_level_summary"`: (String, 3-4 sentences) A concise summary of the overall findings, highlighting key sentiments, themes, and potential actions.
12. `"display_name"`: (String) A product display name that MUST start with the exact brand name followed by the specific product identifier. REQUIRED FORMAT: "[EXACT BRAND NAME] [SPECIFIC PRODUCT NAME]" where brand name is the manufacturer (e.g., "HERBIVORE", "SAMSUNG", "NIKE") and product name is the specific product (e.g., "Bakuchiol Retinol", "Galaxy S23", "Air Jordan 4"). NEVER use generic descriptors like "Gentle Serum" or "Retinol Alternative" alone. ALWAYS retain the exact brand name from '{original_product_title}' as the first word(s) and then the specific product identifier. Examples: For "HERBIVORE Bakuchiol Retinol Alternative" use "HERBIVORE Bakuchiol Retinol"; For "L'Oreal Paris Age Perfect Cell Renewal" use "L'Oreal Paris Age Perfect". Limit to 3-6 words total.

**CRITICAL:** Your response MUST be ONLY the single, valid JSON object described above, containing exactly the 12 specified keys and adhering strictly to their defined types. The three sentiment scores MUST sum precisely to 1.0.
{{ ... }}
"""
    # Prepare the payload for the API
    payload = {
        "model": "deepseek-chat", # Or the specific model you use
        "messages": [
            {"role": "system", "content": "You are an expert review analysis assistant. Your task is to analyze the provided review data and return insights ONLY in the specified JSON format."},            
            {"role": "user", "content": prompt}
        ],
        "response_format": {"type": "json_object"}, # Request JSON output if API supports
        "temperature": 0.5, # Adjust for desired creativity/determinism
        "max_tokens": 2048 # Adjust based on expected output size
    }

    # Use the OpenAI compatible endpoint if DeepSeek provides one, or their specific URL
    api_url = "https://api.deepseek.com/chat/completions" # Verify DeepSeek endpoint
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }

    try:
        logger.info("Calling DeepSeek API with refined prompt...")
        logger.debug(f"DeepSeek Payload Keys: {list(payload.keys())}") # Don't log full payload
        
        # Increased timeout to 180 seconds (3 minutes)
        response = requests.post(api_url, headers=headers, json=payload, timeout=180)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)

        logger.info("DeepSeek API call successful.")
        response_json = response.json()
        logger.debug(f"DeepSeek Raw Response Snippet: {str(response_json)[:200]}...") # Log snippet

        # --- Safely extract the structured JSON content --- 
        analysis_result = None
        if response_json and 'choices' in response_json and len(response_json['choices']) > 0:
            first_choice = response_json['choices'][0]
            if 'message' in first_choice and 'content' in first_choice['message']:
                message_content = first_choice['message']['content']
                # Try parsing the content as JSON
                try:
                    analysis_result = json.loads(message_content)
                    # Basic validation: check if it's a dictionary
                    if not isinstance(analysis_result, dict):
                         logger.error(f"Parsed content from DeepSeek is not a JSON object (dict), type: {type(analysis_result)}")
                         return {"error": "API returned non-dictionary JSON content"}
                    logger.info("Successfully parsed JSON content from DeepSeek response.")
                    logger.debug(f"Parsed DeepSeek JSON keys: {list(analysis_result.keys())}")
                except json.JSONDecodeError as json_err:
                    logger.error(f"Failed to parse JSON from DeepSeek message content: {json_err}")
                    logger.debug(f"Non-JSON Content Received: {message_content[:500]}...") # Log problematic content snippet
                    return {"error": f"Failed to parse API JSON response: {json_err}"}
            else:
                 logger.error("No 'content' found in DeepSeek response message.")
                 return {"error": "API response message structure missing 'content'"}
        else:
            logger.error("No 'choices' found in DeepSeek API response.")
            return {"error": "API response structure missing 'choices'"}
        # --- End extraction --- 
        
        return analysis_result if analysis_result else {"error": "Failed to extract analysis from API response"}

    except requests.exceptions.Timeout:
        logger.error("DeepSeek API request timed out.")
        return {"error": "API request timed out"}
    except requests.exceptions.RequestException as e:
        logger.error(f"DeepSeek API request failed: {e}")
        # Log response body if available for non-timeout errors
        error_details = "No response body available."
        if e.response is not None:
            try:
                error_details = e.response.text
            except Exception:
                error_details = "Could not read response body."
        logger.error(f"DeepSeek Error Details: {error_details}")
        return {"error": f"API request failed: {e}"}
    except Exception as e:
        logger.exception(f"An unexpected error occurred during DeepSeek API call: {e}")
        return {"error": f"An unexpected error occurred: {e}"}