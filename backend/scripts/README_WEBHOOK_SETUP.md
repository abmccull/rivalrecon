# Setting Up Supabase Database Triggers for Webhooks

This document explains how to set up Supabase database triggers to notify our backend when new submissions are created.

## Prerequisites

1. A running backend server accessible via the internet (e.g., deployed on Railway)
2. Supabase project with the `net` extension enabled

## Step 1: Enable the HTTP Extension in Supabase

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL to enable the `net` extension:

```sql
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA net;
```

## Step 2: Update the Webhook URL

1. Open the `create_supabase_trigger.sql` script
2. Replace `https://your-backend-domain.com/webhooks/submission-created` with your actual backend URL
   - For example: `https://rivalrecon-production.up.railway.app/webhooks/submission-created`

## Step 3: Run the SQL Script

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `create_supabase_trigger.sql`
4. Update the webhook URL as noted above
5. Run the script

## Step 4: Test the Integration

1. Create a new submission through the app (Next.js frontend) located in /app
2. Check the backend logs to verify that the webhook was received
3. Verify that the Celery task was queued and executed

## Troubleshooting

### Webhook Not Triggering

1. Check if the submission is created with `status = 'pending'`
2. Verify that the `net` extension is enabled in Supabase
3. Check the Supabase function logs for any errors

### Backend Not Receiving Webhook

1. Make sure your backend is accessible from the internet
2. Check the URL in the trigger function
3. Check firewall settings and ensure your backend allows incoming requests

### Task Not Queuing

1. Verify that Redis is running and accessible from the backend
2. Check that the Celery worker is running
3. Check the backend logs for any errors in the webhook handler

## Further Improvements

- Add authentication to the webhook (e.g., using a shared secret)
- Implement retries for failed webhook calls
- Add monitoring and alerting for webhook failures