#!/bin/bash

# Load environment variables
set -a
source .env
set +a

# Check if Redis is running
if ! pgrep -x "redis-server" > /dev/null; then
    echo "Starting Redis server..."
    redis-server &
    sleep 2
fi

# Start Celery worker in background
echo "Starting Celery worker..."
cd worker
source venv/bin/activate
celery -A worker worker --loglevel=info &
CELERY_PID=$!

# Go back to backend directory
cd ..

# Start Express server
echo "Starting Express server..."
npm start

# Cleanup on exit
trap "kill $CELERY_PID" EXIT 