const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');

// Create direct Redis client for testing
const redis = new Redis('redis://localhost:6379/0');

// Create a full Celery-compatible message
function createCeleryMessage(taskName, args = [], kwargs = {}) {
  const taskId = uuidv4();
  const fullTaskName = `worker.${taskName}`;
  
  // Format 1: Basic task structure (works with some Celery versions)
  const basicMessage = {
    id: taskId,
    task: fullTaskName,
    args: args,
    kwargs: kwargs,
    retries: 0,
    eta: null,
    expires: null,
    utc: true
  };
  
  // Format 2: More complex structure with properties (works with newer Celery)
  const complexMessage = {
    body: basicMessage,
    content_type: 'application/json',
    content_encoding: 'utf-8',
    properties: {
      correlation_id: taskId,
      reply_to: '',
      delivery_mode: 2,
      delivery_info: {
        exchange: '',
        routing_key: 'celery'
      }
    }
  };
  
  return { 
    basic: JSON.stringify(basicMessage),
    complex: JSON.stringify(complexMessage)
  };
}

async function diagnoseRedis() {
  try {
    console.log('Connecting to Redis...');
    await redis.ping();
    console.log('Connected to Redis successfully!');
    
    // Clear the queue for a clean test
    await redis.del('celery');
    console.log('Celery queue cleared.');
    
    // Create test messages
    const taskMessages = createCeleryMessage('scrape_reviews', ['https://example.com']);
    
    // Try both formats
    console.log('\n=== TESTING BASIC FORMAT ===');
    console.log('Message format:', taskMessages.basic.substring(0, 100) + '...');
    const basicResult = await redis.rpush('celery', taskMessages.basic);
    console.log(`Push result: ${basicResult}`);
    
    console.log('\n=== TESTING COMPLEX FORMAT ===');
    console.log('Message format:', taskMessages.complex.substring(0, 100) + '...');
    const complexResult = await redis.rpush('celery', taskMessages.complex);
    console.log(`Push result: ${complexResult}`);
    
    // Wait for Celery to process messages
    console.log('\nWaiting 2 seconds for Celery to process...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check queue
    const queueLength = await redis.llen('celery');
    console.log(`\nQueue length after processing: ${queueLength}`);
    
    if (queueLength > 0) {
      const queueContents = await redis.lrange('celery', 0, -1);
      console.log('Remaining items in queue:');
      queueContents.forEach((item, i) => {
        console.log(`[${i}] ${item.substring(0, 100)}...`);
      });
    }
    
    // Close Redis connection
    await redis.quit();
    console.log('\nDiagnosis complete. Redis connection closed.');
    
  } catch (error) {
    console.error('Error during diagnosis:', error);
  }
}

diagnoseRedis(); 