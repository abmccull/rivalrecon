const { v4: uuidv4 } = require('uuid');
const Redis = require('ioredis');
// const celery = require('celery-node'); // Keep for potential future use? Maybe remove if only using raw redis.
const util = require('util'); // Import util for promisify if needed elsewhere, though not directly for rpush here

class TaskManager {
  constructor(redisUrl) {
    // Maintain connection robustness
    this.redis = new Redis(redisUrl, {
      retryStrategy: times => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3
    });
    this.redis.on('error', (err) => console.error('Redis Client Error:', err));
    this.redis.on('connect', () => console.log('Connected to Redis'));

    this.taskResultPrefix = 'celery-task-meta-';
    this.defaultQueue = 'celery'; // Default Celery queue name
  }

  /**
   * Create a Celery-compatible task message following Kombu structure
   * @param {string} taskName - Name of the task 
   * @param {Array} args - Task arguments
   * @param {Object} kwargs - Task keyword arguments
   * @returns {Object} - Task ID and stringified message
   */
  createTaskMessage(taskName, args = [], kwargs = {}, taskId = uuidv4()) {
    // 1. Create the inner message payload (what we had before)
    const payload = {
      task: taskName,
      id: taskId,
      args: args,
      kwargs: kwargs,
      retries: 0,
      eta: null,
      expires: null,
      utc: true,
      callbacks: null,
      errbacks: null,
      chain: null,
      chord: null,
      timelimit: [null, null], // [soft, hard]
      taskset: null,
      group: null,
      parent_id: null,
      root_id: taskId,
      origin: 'nodejs@' + (process.env.HOSTNAME || 'unknown')
    };

    // 2. Base64 encode the JSON string of the payload
    const body = Buffer.from(JSON.stringify(payload)).toString('base64');

    // 3. Construct the full message envelope expected by Kombu/Celery
    const messageEnvelope = {
      body: body,
      'content-encoding': 'utf-8',
      'content-type': 'application/json',
      headers: {}, // Celery protocol v2 doesn't typically use headers much here
      properties: {
        correlation_id: taskId,
        reply_to: taskId, // Important for results backend
        delivery_mode: 2, // 2 for persistent
        delivery_info: {
          exchange: '', // Default exchange
          routing_key: this.defaultQueue // Target queue name
        },
        priority: 0, // Default priority
        body_encoding: 'base64',
        delivery_tag: uuidv4() // Must be unique per message delivery
      }
    };

    // 4. Stringify the entire envelope
    const messageString = JSON.stringify(messageEnvelope);
    console.log(`Created full Celery message envelope for ${taskName}, ID: ${taskId}`);
    // console.log(`Message String (first 100 chars): ${messageString.substring(0, 100)}...`); // Optional: Log snippet
    return { messageString, taskId };
  }

  /**
   * Queue a task in Redis
   * @param {string} queue - Queue name
   * @param {string} messageStr - Stringified message
   * @returns {Promise<number>} - Queue length after push
   */
  async queueTask(queue, messageStr) {
    try {
      // Use rpush with separate arguments for queue and message
      return await this.redis.rpush(queue, messageStr);
    } catch (error) {
      console.error('Error queuing task:', error);
      throw error;
    }
  }

  /**
   * Queue a new scraping task
   * @param {string} submissionId - The submission ID
   * @param {string} url - The URL to scrape
   * @returns {Promise<string>} - Task ID
   */
  async queueScrapeTask(submissionId, url) {
    console.log(`Creating scrape task for URL: ${url} and submission ID: ${submissionId}`);
    const { messageString, taskId } = this.createTaskMessage('scrape_product_reviews', [submissionId, url], {});
    const queueName = this.defaultQueue;

    try {
      console.log(`Safe RPUSH to queue: ${queueName}, message length: ${messageString.length}`);
      const result = await this.redis.rpush(queueName, messageString);
      console.log(`Task ${taskId} queued successfully, RPUSH result: ${result}`);
      return taskId;
    } catch (error) {
      console.error(`Error queueing scrape task ${taskId}:`, error);
      throw new Error('Failed to queue scrape task');
    }
  }

  /**
   * Queue a review analysis task
   * @param {Object} reviewsData - The reviews data to analyze
   * @param {string} submissionId - The submission ID
   * @returns {Promise<string>} - Task ID
   */
  async queueAnalysisTask(submissionId) {
    console.log(`Creating analysis task for submission ID: ${submissionId}`);
    const { messageString, taskId } = this.createTaskMessage('analyze_reviews', [submissionId], {});
    const queueName = this.defaultQueue;

    try {
      console.log(`Safe RPUSH to queue: ${queueName}, message length: ${messageString.length}`);
      const result = await this.redis.rpush(queueName, messageString);
      console.log(`Task ${taskId} queued successfully, RPUSH result: ${result}`);
      return taskId;
    } catch (error) {
      console.error(`Error queueing analysis task ${taskId}:`, error);
      throw new Error('Failed to queue analysis task');
    }
  }

  /**
   * Get task result
   * @param {string} taskId - The task ID to check
   * @returns {Promise<Object|null>} - Task result or null if not ready
   */
  async getTaskResult(taskId) {
    const key = this.taskResultPrefix + taskId;
    try {
      const resultString = await this.redis.get(key);
      if (!resultString) {
        // console.log(`No result found yet for task ${taskId}`);
        return null; // Task result not yet available or task ID is wrong
      }
      // console.log(`Raw result string for task ${taskId}: ${resultString}`);
      const result = JSON.parse(resultString);
      // console.log(`Parsed result for task ${taskId}:`, result);
      return result;
    } catch (error) {
      console.error(`Error retrieving result for task ${taskId} from Redis:`, error);
      // Attempt to retrieve raw string again if JSON parsing fails, might indicate non-JSON data
      try {
        const rawData = await this.redis.get(key);
        console.error(`Raw data for task ${taskId} on error:`, rawData);
      } catch (innerError) {
        console.error(`Could not retrieve raw data for task ${taskId} on error:`, innerError);
      }
      // Return an error state or throw? Depending on desired handling.
      return { status: 'ERROR', result: 'Failed to parse result from Redis', error: error.message };
    }
  }

  /**
   * Wait for task completion with timeout
   * @param {string} taskId - The task ID to wait for
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Object>} - Task result
   */
  async waitForTaskCompletion(taskId, timeout = 600000, interval = 2000) { // Increased default timeout to 10 mins
    const startTime = Date.now();
    console.log(`Waiting for task ${taskId} completion...`);

    while (Date.now() - startTime < timeout) {
      try {
        const result = await this.getTaskResult(taskId);
        if (result) {
          console.log(`Task ${taskId} status: ${result.status}`);
          // Celery ready states: SUCCESS, FAILURE, REVOKED
          const readyStates = ['SUCCESS', 'FAILURE', 'REVOKED'];
          if (readyStates.includes(result.status)) {
            console.log(`Task ${taskId} completed with status: ${result.status}`);
            // You might want to delete the result key from Redis here if desired
            // await this.redis.del(this.taskResultPrefix + taskId);
            return result;
          }
        } // else result is null, task not finished or ID wrong
      } catch (error) {
        console.error(`Error checking status for task ${taskId}:`, error);
        // Decide if we should break the loop or continue retrying
        // For now, we continue polling until timeout
      }
      await new Promise(resolve => setTimeout(resolve, interval)); // Wait before polling again
    }

    console.error(`Timeout waiting for task ${taskId} completion.`);
    throw new Error(`Timeout waiting for task ${taskId}`);
  }

  // Helper to store the mapping between submission ID and task ID
  async storeTaskIdForSubmission(submissionId, taskId) {
    const key = `submission:${submissionId}:task_id`;
    try {
      await this.redis.set(key, taskId, 'EX', 3600 * 24); // Expire after 24 hours
      console.log(`Stored task ID ${taskId} for submission ${submissionId} in Redis`);
    } catch (error) {
      console.error(`Error storing task ID for submission ${submissionId} in Redis:`, error);
    }
  }

  // Helper to retrieve the task ID for a given submission ID
  async getTaskIdForSubmission(submissionId) {
    const key = `submission:${submissionId}:task_id`;
    try {
      const taskId = await this.redis.get(key);
      // console.log(`Retrieved task ID ${taskId} for submission ${submissionId}`);
      return taskId;
    } catch (error) {
      console.error(`Error retrieving task ID for submission ${submissionId} from Redis:`, error);
      return null;
    }
  }

  async close() {
    await this.redis.quit();
    console.log('Redis connection closed.');
  }
}

module.exports = TaskManager; 