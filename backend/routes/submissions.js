const express = require('express');
const TaskManager = require('../services/taskManager');
const redis = require('../config/redis');
const router = express.Router();

// Get Supabase client from parent module
const supabase = require('../index').supabase;

// Initialize TaskManager with Redis URL
const taskManager = new TaskManager(process.env.REDIS_URL || 'redis://localhost:6379');

// Submit URL for analysis
router.post('/', async (req, res) => {
  try {
    const { url, is_competitor_product = false } = req.body;
    const userId = req.user.id;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }



    // Create submission record
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert([
        {
          url,
          user_id: userId,
          status: 'pending',
          is_competitor_product
        }
      ])
      .select()
      .single();

    if (submissionError) {
      console.error('Supabase error:', submissionError);
      throw submissionError;
    }



    // Queue scraping task with proper error handling
    try {
      // Queue task to scrape reviews

      const taskId = await taskManager.queueScrapeTask(submission.id, url);

      
      // Store the task ID in Redis instead of updating the Supabase record
      // This avoids the schema issue with the missing task_id column
      await redis.set(`submission:${submission.id}:task_id`, taskId);

      
      res.json({
        message: 'Submission created successfully',
        submission: {
          id: submission.id,
          url,
          status: 'pending'
        }
      });
    } catch (taskError) {
      console.error('Error queueing task:', taskError);
      
      // Update submission to failed status since task queueing failed
      await supabase
        .from('submissions')
        .update({ status: 'failed' })
        .eq('id', submission.id);
        
      throw new Error(`Failed to queue task: ${taskError.message}`);
    }

  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ error: 'Failed to process submission: ' + error.message });
  }
});

// Get all submissions for user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;


    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*, reviews(id, review_rating, review_date), analyses(id, ratings_over_time, trending, top_positives, top_negatives, word_map, competitive_insights, opportunities)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error details:', JSON.stringify(error, null, 2));
      throw error;
    }


    res.json(submissions);

  } catch (error) {
    console.error('Error fetching submissions:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get submission by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: submission, error } = await supabase
      .from('submissions')
      .select(`
        *,
        reviews (
          id,
          review_rating,
          review_text,
          review_date,
          review_title,
          review_images,
          verified_purchase,
          api_review_id,
          review_author,
          helpful_votes_text,
          is_vine_review
        ),
        analyses (
          id,
          ratings_over_time,
          trending,
          top_positives,
          top_negatives,
          word_map,
          competitive_insights,
          opportunities
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw error;
    }

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Get task ID from Redis instead of the submission record
    const taskId = await redis.get(`submission:${id}:task_id`);
    submission.task_id = taskId;

    // If task is still running, get latest status
    if (submission.task_id && submission.status === 'pending') {
      try {
        const taskResult = await taskManager.getTaskResult(submission.task_id);
        if (taskResult) {
          // Update submission status based on task result
          const newStatus = taskResult.status === 'completed' ? 'completed' : 'failed';
          await supabase
            .from('submissions')
            .update({ status: newStatus })
            .eq('id', submission.id);
          
          submission.status = newStatus;
        }
      } catch (taskError) {
        console.error('Error checking task status:', taskError);
      }
    }

    res.json(submission);

  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

// Check task status
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: submission, error } = await supabase
      .from('submissions')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw error;
    }

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Get task ID from Redis
    const taskId = await redis.get(`submission:${id}:task_id`);
    if (!taskId) {
      return res.status(400).json({ error: 'No task associated with this submission' });
    }

    const taskResult = await taskManager.getTaskResult(taskId);
    
    res.json({
      status: taskResult ? taskResult.status : 'pending',
      result: taskResult
    });

  } catch (error) {
    console.error('Error checking task status:', error);
    res.status(500).json({ error: 'Failed to check task status' });
  }
});

module.exports = router; 