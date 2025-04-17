require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function processPendingSubmissions() {
  try {
    // Get all pending submissions
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('status', 'pending');

    if (error) throw error;

    console.log(`Found ${submissions?.length || 0} pending submissions`);

    // Process each submission
    for (const submission of submissions || []) {
      // Create Celery task in correct format
      const task = {
        body: JSON.stringify([submission.url], {}),
        headers: {},
        content_type: 'application/json',
        content_encoding: 'utf-8',
        properties: {
          correlation_id: submission.id,
          reply_to: null,
          delivery_mode: 2,
          delivery_info: {
            exchange: '',
            routing_key: 'celery'
          },
          priority: 0,
          body_encoding: 'base64'
        }
      };

      // Push task to Redis queue with correct key format
      await redis.rpush('celery', JSON.stringify(task));
      console.log(`Queued task for submission ${submission.id}`);

      // Update submission status to processing
      await supabase
        .from('submissions')
        .update({ status: 'processing' })
        .eq('id', submission.id);
    }

    console.log('All pending submissions have been queued');
  } catch (error) {
    console.error('Error processing submissions:', error);
  } finally {
    redis.quit();
  }
}

processPendingSubmissions(); 