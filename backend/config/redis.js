const Redis = require('ioredis');
const { REDIS_URL = 'redis://localhost:6379' } = process.env;

// Create Redis client
const redis = new Redis(REDIS_URL, {
  retryStrategy: (times) => {
    // Exponential backoff with max 2000ms delay
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3
});

// Handle Redis connection events
redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

// Monkey-patch the Redis client to fix the parameter handling issue
const originalSendCommand = redis.sendCommand;
redis.sendCommand = function(command) {
  if (command.name === 'rpush') {
    // Log and fix rpush commands
    if (command.args && command.args.length >= 2) {
      const key = command.args[0];
      // If the first argument contains a comma, it's likely a concatenated key and value
      if (typeof key === 'string' && key.includes(',')) {
        const commaIndex = key.indexOf(',');
        const fixedKey = key.substring(0, commaIndex);
        const value = key.substring(commaIndex + 1);
        console.log(`⚠️ Fixed malformed Redis rpush: separated key and value`);
        command.args = [fixedKey, value];
      }
    }
    console.log(`Redis RPUSH to '${command.args[0]}' with ${command.args.length - 1} values`);
  }
  return originalSendCommand.call(this, command);
};

// Add a specialized version of rpush for Celery-compatible task messages
redis.safeRpush = async function(queue, message) {
  console.log(`Safe RPUSH to queue: ${queue}, message length: ${message.length}`);
  
  // Log a truncated version of the message for debugging
  try {
    const msgObj = JSON.parse(message);
    // Safely access nested properties
    const taskBodyStr = msgObj?.body;
    if (taskBodyStr) {
      const taskBody = JSON.parse(taskBodyStr);
      const task = taskBody?.task;
      const id = taskBody?.id;
      const argsString = JSON.stringify(taskBody?.args || []); // Default to empty array if args is missing
      console.log(`Message details: task=${task || 'N/A'}, id=${id || 'N/A'}, args=${argsString.substring(0, 50)}...`);
    } else {
      console.log('Message body not found or invalid structure for detailed logging.');
    }
  } catch (e) {
    console.error('Error logging detailed message info:', e);
  }
  
  // This format works with Celery's Python client
  return this.call('RPUSH', [queue, message]);
};

// Check how redis is handling the message push operations

module.exports = redis; 