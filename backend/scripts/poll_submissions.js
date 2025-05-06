/**
 * Poll Submissions Script
 * 
 * This script periodically checks for new submissions in Supabase that don't have tasks queued
 * and queues tasks for them. It's a workaround for local development where Supabase webhooks
 * can't reach localhost directly.
 * 
 * In production, this script is not needed if Supabase webhooks are properly configured.
 */

const { createClient } = require('@supabase/supabase-js');
const TaskManager = require('../services/taskManager');
const logger = require('../utils/logger');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

// Configurations
const POLL_INTERVAL_MS = 5000; // Poll every 5 seconds
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/0';

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const taskManager = new TaskManager(REDIS_URL);

/**
 * Poll for new submissions and queue tasks
 */
async function pollSubmissions() {
  try {
    // Find pending submissions that were created recently and don't have a task_id in Redis
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('id, url, is_competitor_product')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      logger.error('Error fetching submissions:', error);
      return;
    }

    if (!submissions || submissions.length === 0) {
      // No new submissions
      return;
    }

    // For each submission, check if it has a task_id in Redis
    for (const submission of submissions) {
      try {
        const existingTaskId = await taskManager.getTaskIdForSubmission(submission.id);
        
        if (!existingTaskId) {
          // No task exists for this submission, queue one
          logger.info(`Queueing task for submission ${submission.id}`);
          const taskId = await taskManager.queueScrapeTask(submission.id, submission.url);
          logger.info(`Queued task ${taskId} for submission ${submission.id}`);
          
          // Store the mapping between submission ID and task ID
          await taskManager.storeTaskIdForSubmission(submission.id, taskId);
        }
      } catch (err) {
        logger.error(`Error processing submission ${submission.id}:`, err);
      }
    }
  } catch (error) {
    logger.error('Error polling submissions:', error);
  } finally {
    // Schedule the next poll
    setTimeout(pollSubmissions, POLL_INTERVAL_MS);
  }
}

// Start polling
logger.info('Starting submission polling...');
pollSubmissions();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down submission poller...');
  await taskManager.close();
  process.exit(0);
});

// Log any unhandled errors but keep the process running
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});
