import os
import sys
from datetime import datetime

# Add the current directory to the path so we can import the modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the worker modules
from worker.worker import scrape_reviews

# Generate a unique test submission ID
test_submission_id = f"test-{int(datetime.now().timestamp())}"

# Amazon product URL to test with
test_url = "https://www.amazon.com/Apple-AirPods-Wireless-Charging-Case/dp/B07PYLT6DN"

print(f"Starting test scrape with submission ID: {test_submission_id}")
print(f"URL: {test_url}")

# Run the scrape_reviews function directly (not as a Celery task)
result = scrape_reviews(test_submission_id, test_url)

print(f"Task completed with result: {result}")
