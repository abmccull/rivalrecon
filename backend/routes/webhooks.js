const express = require('express');
const router = express.Router();
const TaskManager = require('../services/taskManager');
const taskManager = new TaskManager(process.env.REDIS_URL || 'redis://localhost:6379/0');
const logger = require('../utils/logger');

/**
 * Webhook endpoint for Supabase database triggers
 * This endpoint receives notifications when new submissions are created
 * and queues the appropriate Celery task for processing
 */
router.post('/submission-created', async (req, res) => {
  try {
    // Extract the submission data from the webhook payload
    const { record } = req.body;
    
    if (!record || !record.id || !record.url) {
      logger.error('Invalid webhook payload:', req.body);
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }
    
    logger.info(`Received webhook for new submission: ${record.id}`);
    
    // Queue the scrape_reviews Celery task using TaskManager
    const taskId = await taskManager.queueScrapeTask(record.id, record.url);
    
    logger.info(`Queued scrape_reviews task (${taskId}) for submission ${record.id}`);
    
    // Respond with success
    return res.status(200).json({ 
      success: true, 
      message: 'Task queued successfully',
      taskId
    });
    
  } catch (error) {
    logger.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 