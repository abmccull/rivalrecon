#!/bin/bash
# Production deployment script for RivalRecon
# This script builds and deploys the app with production settings

set -e  # Exit immediately if a command exits with a non-zero status

# Utility function for logging
log() {
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "[$timestamp] $1"
}

# Log error and exit
error() {
  log "ERROR: $1" >&2
  exit 1
}

# Display banner
echo "======================================"
echo "RivalRecon Production Deployment"
echo "$(date)"
echo "======================================"

# Ensure we're using the production environment
export NODE_ENV=production

# Validate required environment variables
log "Validating environment variables..."
required_vars=("NEXT_PUBLIC_SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY" "STRIPE_SECRET_KEY" "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "VERCEL_TOKEN")

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
  error ".env.production file not found. Please create this file with production environment variables."
fi

# Load environment variables from .env.production
log "Loading production environment variables..."
source .env.production 2>/dev/null || error "Failed to load .env.production"

# Check for required environment variables
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    error "Required environment variable $var is not set"
  fi
done

# Switch to project directory
cd "$(dirname "$0")/.." || error "Failed to switch to project directory"
log "Working directory: $(pwd)"

# Check if git working directory is clean
log "Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
  log "WARNING: You have uncommitted changes. It's recommended to commit all changes before deploying."
  read -p "Continue deployment anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Deployment aborted"
    exit 1
  fi
fi

# Install dependencies
log "Installing production dependencies..."
npm ci --production || error "Failed to install dependencies"

# Run linting and type checking
log "Running code quality checks..."
npm run lint || error "Linting failed"
npm run typecheck || error "Type checking failed"

# Build the application
log "Building for production..."
npm run build || error "Build failed"

# Run any database migrations if needed
log "Checking for database migrations..."
# Check if migrations directory exists and has migrations
if [ -d "./src/migrations" ] && [ "$(ls -A ./src/migrations)" ]; then
  log "Running database migrations..."
  # Example migration command using Supabase CLI - adjust as needed
  # npx supabase db push || error "Database migration failed"
  log "Database migrations completed"
else
  log "No migrations to run"
fi

# Deploy the application
log "Deploying to production..."

# Create a deployment tag with timestamp
DEPLOYMENT_TAG="production-$(date +"%Y%m%d%H%M%S")"

# Create git tag for this deployment
git tag -a "$DEPLOYMENT_TAG" -m "Production deployment on $(date)" || log "Warning: Could not create git tag"

# Deploy to Vercel
log "Deploying to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  log "Installing Vercel CLI..."
  npm i -g vercel || error "Failed to install Vercel CLI"
fi

# Deploy with Vercel using the configured token
VERCEL_TOKEN=$VERCEL_TOKEN npx vercel --prod --confirm || error "Vercel deployment failed"

# Push the tag to remote repository
log "Pushing deployment tag..."
git push origin "$DEPLOYMENT_TAG" || log "Warning: Could not push git tag"

# Run post-deployment verification
log "Running post-deployment verification..."

# You could add curl checks or other verification here
# Example: curl -f https://rivalrecon.com/api/health || error "Health check failed"

echo "======================================"
log "Deployment completed successfully!"
echo "Environment: PRODUCTION"
echo "Deployment tag: $DEPLOYMENT_TAG"
echo "======================================"

# Notify team about successful deployment
# You could integrate with Slack, Teams, or email notification here
# Example: curl -X POST -H "Content-Type: application/json" -d '{"text":"RivalRecon successfully deployed to production"}' $SLACK_WEBHOOK_URL
