const taskManager = require('./services/taskManager');

// Test function to send a task to Celery
async function testTaskMessage() {
  try {
    console.log('Testing task message creation and queuing...');
    
    // Test URL - replace with a valid URL for your scraper
    const testUrl = 'https://www.amazon.com/sample-product';
    
    // Queue the task and get the task ID
    console.log('Queueing scrape task for:', testUrl);
    const taskId = await taskManager.queueScrapeTask(testUrl);
    console.log(`Task queued successfully. Task ID: ${taskId}`);
    
    // Wait for a short time and then check for results
    console.log('Waiting for 10 seconds before checking task result...');
    setTimeout(async () => {
      try {
        const result = await taskManager.getTaskResult(taskId);
        console.log('Task result:', result ? JSON.stringify(result, null, 2) : 'Not ready yet');
      } catch (error) {
        console.error('Error checking task result:', error);
      }
      
      // Close Redis connection
      console.log('Test completed, exiting...');
      setTimeout(() => process.exit(0), 1000);
    }, 10000);
    
  } catch (error) {
    console.error('Error in test:', error);
    process.exit(1);
  }
}

// Run the test
testTaskMessage(); 