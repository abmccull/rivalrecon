import os
from dotenv import load_dotenv
from worker import scrape_reviews

# Load environment variables from .env file in the current directory (backend)
load_dotenv()

# --- Configuration ---
test_submission_id = '66f256ad-a260-4ec3-8faa-948beaa73379'
test_url = 'https://www.amazon.com/Herbivore-Bakuchiol-Natural-Retinol-Alternative/dp/B07YZNT3RV/ref=cm_cr_arp_d_product_top?ie=UTF8&th=1'
# -------------------

if __name__ == '__main__':
    print(f"Attempting to send task for submission ID: {test_submission_id}")
    try:
        task_result = scrape_reviews.delay(submission_id=test_submission_id, url=test_url)
        print(f"Task {task_result.id} sent to the queue successfully.")
    except Exception as e:
        print(f"Error sending task to queue: {e}")
