const redis = require('./config/redis');

// Test function to push a message to Redis
async function testRedisRpush() {
  try {
    console.log('Testing Redis rpush command...');
    
    // Create a test message
    const testMessage = JSON.stringify({
      body: {
        task: 'worker.test_task',
        id: '12345',
        args: ['test'],
        kwargs: {},
        retries: 0,
        eta: null,
        expires: null,
        utc: true
      },
      content_type: 'application/json',
      content_encoding: 'utf-8',
      properties: {
        correlation_id: '12345',
        reply_to: '',
        delivery_mode: 2,
        delivery_info: {
          exchange: '',
          routing_key: 'celery'
        }
      }
    });
    
    // Push to Redis and get the length
    const result = await redis.rpush('test-queue', testMessage);
    console.log(`Message pushed successfully. Queue length: ${result}`);
    
    // Read back the message
    const messages = await redis.lrange('test-queue', -1, -1);
    console.log('Retrieved message:');
    console.log(messages[0]);
    
    // Clean up
    await redis.del('test-queue');
    console.log('Test queue cleaned up');
    
    // Close Redis connection
    redis.quit();
    
  } catch (error) {
    console.error('Error in test:', error);
    process.exit(1);
  }
}

// Run the test
testRedisRpush(); 