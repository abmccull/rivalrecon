# RivalRecon System Architecture

This document provides a comprehensive overview of the RivalRecon application architecture, including all components, data flows, system interactions, and environment configuration.

## System Components

### 1. Frontend Application (Next.js)
- **Location**: `/app` directory
- **Technology**: Next.js 15, React, TypeScript
- **Port**: 3000
- **Purpose**: User interface for submitting URLs for analysis, viewing results, and managing account
- **Environment Configuration**: Uses `.env.local` for development and `.env.production` for production

### 2. Backend API Server (Express.js)
- **Location**: `/backend` directory
- **Technology**: Node.js, Express.js
- **Port**: 3001
- **Purpose**: Handles webhooks from Supabase, manages task queuing, and provides API endpoints
- **Environment Configuration**: Uses `.env` file in the `/backend` directory

### 3. Database (Supabase)
- **URL**: `https://yqpyrnnxswvlnuuijmsn.supabase.co`
- **Technology**: PostgreSQL with Supabase extensions
- **Purpose**: Stores all application data, user information, submissions, reviews, and analyses
- **Webhook Configuration**: Uses PostgreSQL trigger functions to send webhooks on data changes

### 4. Message Broker (Redis)
- **Location**: Local or cloud-hosted instance
- **Port**: 6379
- **Purpose**: Acts as a message queue between the backend and worker processes
- **Connection Configuration**: Configured via environment variables in both backend and worker

### 5. Worker Process (Celery + Python)
- **Location**: `/backend/worker` directory
- **Technology**: Python, Celery
- **Purpose**: Performs asynchronous processing of CPU-intensive tasks like web scraping and analysis
- **Environment Configuration**: Uses environment variables from the system environment or `.env` file

### 6. DeepSeek AI Integration
- **Purpose**: Analyzes review data and generates insights
- **Integration Point**: Called by the Celery worker during analysis tasks
- **API Configuration**: Configured through environment variables in the worker environment

## Data Flow & Process Description

### 1. User Submission Flow
1. **User Action**: User submits a product URL via the frontend dashboard
2. **Frontend Processing**:
   - Frontend validates the URL
   - Makes a direct API call to Supabase to create a submission record
   - Updates UI to show "pending" status

3. **Supabase Database Trigger**:
   - A PostgreSQL trigger function executes on new insertion to the `submissions` table
   - The trigger calls a webhook pointing to the backend server (via ngrok in development)
   ```sql
   BEGIN
     PERFORM
       net.http_post(
         url := 'https://c26f-73-20-72-85.ngrok-free.app/webhooks/submission-created',
         body := json_build_object(
           'record', row_to_json(NEW),
           'type', TG_OP,
           'table', TG_TABLE_NAME,
           'schema', TG_TABLE_SCHEMA
         )::jsonb
       );
     RETURN NEW;
   END;
   ```

4. **Backend Webhook Processing**:
   - Backend receives the webhook at `/webhooks/submission-created`
   - Extracts submission details (ID, URL, etc.)
   - Uses TaskManager to create a Celery-compatible task message
   - Queues the task in Redis using RPUSH

5. **Task Queuing**:
   - TaskManager formats the task with proper Celery message format
   - Task is pushed to Redis queue named "celery"
   - Mapping between submission ID and task ID is stored in Redis

### 2. Worker Processing Flow
1. **Task Pickup**:
   - Celery worker continuously polls Redis for new tasks
   - When a task is found, worker deserializes and processes it

2. **Scraping Process** (`worker.scrape_reviews` task):
   - Worker fetches the product URL and submission ID
   - Determines if the URL is for Amazon, Shopify, or another supported platform
   - Uses appropriate scraping strategy based on the URL
   - Extracts product details, review ratings, review text, etc.
   - Stores the scraped reviews in the Supabase `reviews` table
   - Links reviews to the original submission via the submission_id

3. **Analysis Process** (`worker.analyze_reviews` task):
   - Automatically triggered after scraping completes successfully
   - Fetches all reviews for the submission from Supabase
   - Prepares review data for analysis
   - Sends data to DeepSeek AI API with prompts for various analyses
   - Processes AI responses into structured insights
   - Stores analysis results in the Supabase `analyses` table
   - Updates the submission status to "completed"

### 3. Results & Visualization Flow
1. **Dashboard Updates**:
   - Frontend periodically polls for submission status updates
   - When status changes to "completed", fetches full analysis results
   - Renders visualizations including:
     - Rating distribution
     - Sentiment analysis
     - Trending topics
     - Word frequency maps
     - Competitive insights
     - Improvement opportunities

2. **Recurring Analysis** (if enabled):
   - Scheduled tasks periodically re-analyze products
   - Detects changes in sentiment, ratings, or emerging issues
   - Provides trend analysis over time

## Technical Details

### Authentication Flow
- Uses Supabase Auth for user authentication
- JWT tokens stored in client cookies
- Backend API routes protected with auth middleware
- Auth context provider ensures user state persistence

### Redis Configuration
- Used for both:
  - Task queuing (using RPUSH to 'celery' queue)
  - Result storage (using key-value pairs with task IDs)
- Connection parameters stored in environment variables

### Environment Configuration
- Variables managed in `.env.local` and `.env.production`
- Critical variables include:
  - Supabase URL and keys
  - Redis connection details
  - API endpoints and ports

### Development vs Production Setup
- **Development**:
  - Uses ngrok to expose localhost for Supabase webhooks
  - Alternative polling mechanism when ngrok unavailable
- **Production**:
  - Uses actual server URL for webhook endpoint
  - Auto-scaling of worker processes based on queue size

## System Diagram
```
┌────────────┐         ┌─────────────┐          ┌─────────────┐
│   User     │ ──────> │  Frontend   │ ──────>  │  Supabase   │
│ (Browser)  │ <────── │  (Next.js)  │ <──────  │  Database   │
└────────────┘         └─────────────┘          └──────┬──────┘
                                                       │
                                                       │ Webhook
                                                       ▼
┌────────────┐         ┌─────────────┐          ┌─────────────┐
│ DeepSeek   │ <────── │   Worker    │ <──────  │  Backend    │
│    API     │ ──────> │  (Celery)   │          │  (Express)  │
└────────────┘         └──────┬──────┘          └──────┬──────┘
                              │                         │
                              │                         │
                              ▼                         ▼
                        ┌─────────────┐          ┌─────────────┐
                        │ Result Data │ <──────> │    Redis    │
                        │ (Supabase)  │          │  (Queue)    │
                        └─────────────┘          └─────────────┘
```

## Security Considerations

### API Keys & Credentials
- Supabase keys are segregated by environment
- Service role key used only on backend and worker
- Anon key used for frontend client operations

### Data Protection
- Sensitive operations performed server-side
- Client only receives necessary data for display
- Webhook endpoints protected from unauthorized access

### Authentication
- JWT-based authentication via Supabase
- Tokens validated on both frontend and backend
- CORS configured to restrict API access

## Performance Considerations

### Task Processing
- Long-running tasks handled asynchronously
- Tasks broken into discrete steps (scrape -> analyze)
- Result caching to minimize repeated processing

### Scaling
- Worker processes can be horizontally scaled
- Redis supports clustering for high availability
- Supabase provides auto-scaling database

## Monitoring & Maintenance

### Logging
- Centralized logging for all components
- Error tracking with stack traces
- Task status tracking with timing information

### Health Checks
- Endpoint at `/health` for backend status
- Worker heartbeat monitoring
- Redis connection status tracking

## Environment Configuration Guide

### Frontend Environment Variables (Next.js)
**Location**: `/app/.env.local` (development) and `/app/.env.production` (production)

```
# Supabase Configuration - CRITICAL
NEXT_PUBLIC_SUPABASE_URL="https://yqpyrnnxswvlnuuijmsn.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3001"  # Development
# NEXT_PUBLIC_API_URL="https://api.rivalrecon.com"  # Production

# Stripe Configuration (if using payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
```

### Backend Environment Variables
**Location**: `/backend/.env`

```
# Server Configuration
PORT=3001
NODE_ENV=development  # or production

# Supabase Configuration
SUPABASE_URL="https://yqpyrnnxswvlnuuijmsn.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Redis Configuration
REDIS_URL="redis://localhost:6379/0"  # Development
# REDIS_URL="redis://your-production-redis:6379/0"  # Production
CELERY_BROKER_URL="redis://localhost:6379/0"  # Development
# CELERY_BROKER_URL="redis://your-production-redis:6379/0"  # Production
CELERY_RESULT_BACKEND="redis://localhost:6379/0"  # Development
# CELERY_RESULT_BACKEND="redis://your-production-redis:6379/0"  # Production

# Stripe Configuration (if using payments)
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
```

### Worker Environment Variables
**Location**: System environment or `/backend/.env`

```
# Supabase Configuration
SUPABASE_URL="https://yqpyrnnxswvlnuuijmsn.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Redis Configuration
REDIS_URL="redis://localhost:6379/0"  # Development
CELERY_BROKER_URL="redis://localhost:6379/0"  # Development
CELERY_RESULT_BACKEND="redis://localhost:6379/0"  # Development

# RapidAPI Configuration (for Amazon scraping)
RAPIDAPI_KEY="your-rapidapi-key"
RAPIDAPI_HOST="real-time-amazon-data.p.rapidapi.com"

# DeepSeek API Configuration (for AI analysis)
DEEPSEEK_API_KEY="your-deepseek-api-key"
```

### Loading Mechanisms

#### Frontend
The frontend uses Next.js built-in environment loading:
- `env-config.ts`: Loads and validates required environment variables
- Client components: Access via `process.env.NEXT_PUBLIC_*` variables
- Server components: Access all environment variables

#### Backend
The backend loads environment variables using `dotenv`:
```javascript
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
```

#### Worker
The Celery worker loads environment variables using:
```python
from dotenv import load_dotenv
load_dotenv()
```

## Deployment Architecture

### Development Environment
- Local Next.js server on port 3000
- Local Express.js backend on port 3001
- Local Redis instance on port 6379
- ngrok tunnel to expose backend for webhooks

### Production Environment
- Next.js frontend deployed to Vercel
- Backend deployed to cloud VPS or container service
- Redis hosted on cloud provider
- Worker processes in separate containers/instances
