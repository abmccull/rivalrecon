const Redis = require('ioredis');

// Create direct Redis client for testing
const redis = new Redis('redis://localhost:6379/0');

async function diagnoseRedis() {
  try {
    console.log('Connecting to Redis...');
    await redis.ping();
    console.log('Connected to Redis successfully!');
    
    // Clear the queue for a clean test
    await redis.del('celery');
    console.log('Celery queue cleared.');
    
    // Create a properly formatted Celery task message - simplified version
    const simpleTask = {
      id: '123456',
      task: 'worker.scrape_reviews',
      args: ['https://example.com'],
      kwargs: {},
      retries: 0,
      eta: null,
      expires: null,
      utc: true
    };
    
    // Test using traditional message format
    console.log('Pushing simple task message to Redis...');
    
    // Method 1: Using standard rpush
    const simpleResult = await redis.rpush('celery', JSON.stringify(simpleTask));
    console.log(`Simple task push result: ${simpleResult}`);
    
    // Method 2: Using direct command
    console.log('Pushing using direct command...');
    const directResult = await redis.call('RPUSH', 'celery', JSON.stringify(simpleTask));
    console.log(`Direct command result: ${directResult}`);
    
    // Check what's in the queue
    const queueLength = await redis.llen('celery');
    console.log(`Queue length: ${queueLength}`);
    
    const queueContents = await redis.lrange('celery', 0, -1);
    console.log('Queue contents:');
    queueContents.forEach((item, i) => {
      console.log(`[${i}] ${item.substring(0, 100)}...`);
    });
    
    // Close Redis connection
    await redis.quit();
    console.log('Redis connection closed');
    
  } catch (error) {
    console.error('Error during diagnosis:', error);
  }
}

diagnoseRedis(); 