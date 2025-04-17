#!/bin/bash

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check and install Redis if needed
if ! command_exists redis-server; then
    echo "Redis is not installed. Please install Redis first:"
    echo "For macOS: brew install redis"
    echo "For Ubuntu/Debian: sudo apt-get install redis-server"
    echo "For other systems, visit: https://redis.io/download"
    exit 1
fi

# Ensure Redis is running
if ! pgrep redis-server > /dev/null; then
    echo "Starting Redis server..."
    redis-server --daemonize yes
    sleep 2
fi

# Ensure worker directory exists
if [ ! -d "worker" ]; then
    echo "Creating worker directory..."
    mkdir -p worker
fi

# Check if Python virtual environment exists
if [ ! -d "worker/venv" ]; then
    echo "Setting up Python virtual environment..."
    cd worker
    python3 -m venv venv
    source venv/bin/activate
    pip install celery redis requests beautifulsoup4
    cd ..
else
    cd worker
    source venv/bin/activate
    cd ..
fi

# Copy .env file to worker directory
echo "Copying .env file to worker directory..."
if [ -f ".env" ]; then
    cp .env worker/.env
else
    echo "Warning: .env file not found in root directory"
fi

# Start Celery worker in background
echo "Starting Celery worker..."
cd worker
celery -A worker worker --loglevel=info &
CELERY_PID=$!

# Go back to backend directory
cd ..

# Start Express server
echo "Starting Express server..."
npm start

# Function to cleanup processes
cleanup() {
    echo "Cleaning up..."
    if [ -n "$CELERY_PID" ]; then
        kill $CELERY_PID
    fi
    redis-cli shutdown
}

# Set up cleanup on script exit
trap cleanup EXIT 