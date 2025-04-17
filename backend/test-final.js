const redis = require('./config/redis');
const taskManager = require('./services/taskManager');

async function test() {
  try {
    console.log('Testing TaskManager and Redis integration...');
    
    // Clear any existing tasks
    await redis.del('celery');
    console.log('Cleared celery queue');
    
    // Test URL
    const testUrl = 'https://example.com/test-product';
    
    // Create a task using TaskManager
    console.log(`Creating task for URL: ${testUrl}`);
    const taskId = await taskManager.queueScrapeTask(testUrl);
    console.log(`Task created with ID: ${taskId}`);
    
    // Check what's in the Redis queue
    const queueLength = await redis.llen('celery');
    console.log(`Queue length: ${queueLength}`);
    
    if (queueLength > 0) {
      const items = await redis.lrange('celery', 0, -1);
      console.log('Queue contents:');
      items.forEach((item, i) => {
        try {
          const parsed = JSON.parse(item);
          console.log(`[${i}] Task: ${parsed.task || 'unknown'}, ID: ${parsed.id || 'unknown'}`);
          console.log(`Task content: ${JSON.stringify(parsed).substring(0, 100)}...`);
        } catch (e) {
          console.log(`[${i}] Raw item (not JSON): ${item.substring(0, 100)}...`);
        }
      });
      
      // Clean up
      await redis.del('celery');
      console.log('Test queue cleaned up');
    } else {
      console.log('Warning: Queue is empty after task creation');
    }
    
    console.log('Test completed!');
    
    // Close Redis connection
    await redis.quit();
    console.log('Redis connection closed');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
test(); 