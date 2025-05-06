#!/bin/bash

# Set the base URL for your local development server
BASE_URL="http://localhost:3000"

# Helper function to display colored output
print_color() {
  if [ "$2" = "green" ]; then
    echo -e "\033[32m$1\033[0m"
  elif [ "$2" = "red" ]; then
    echo -e "\033[31m$1\033[0m"
  elif [ "$2" = "yellow" ]; then
    echo -e "\033[33m$1\033[0m"
  else
    echo "$1"
  fi
}

# Test 1: API Endpoint Rate Limiting (max: 60 requests/minute)
print_color "Test 1: Testing API rate limiting (sending 65 requests)" "yellow"
for i in {1..65}; do
  response=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Test-IP: test-ip-1" "$BASE_URL/api/user")
  if [ "$response" = "429" ]; then
    print_color "Request $i received rate limit response (429)" "red"
    # Show the full response with headers for the rate-limited request
    curl -s -i -H "X-Test-IP: test-ip-1" "$BASE_URL/api/user"
    break
  else
    echo "Request $i: $response"
  fi
  # Speed up testing - don't wait between requests
done

# Small delay between tests
sleep 2

# Test 2: Stripe Endpoint Rate Limiting (max: 10 requests/minute)
print_color "\nTest 2: Testing Stripe API rate limiting (sending 15 requests)" "yellow"
for i in {1..15}; do
  response=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Test-IP: test-ip-2" "$BASE_URL/api/stripe/portal")
  if [ "$response" = "429" ]; then
    print_color "Request $i received rate limit response (429)" "red"
    # Show the full response with headers for the rate-limited request
    curl -s -i -H "X-Test-IP: test-ip-2" "$BASE_URL/api/stripe/portal"
    break
  else
    echo "Request $i: $response"
  fi
  # Speed up testing - don't wait between requests
done

# Small delay between tests
sleep 2

# Test 3: Auth Endpoint Rate Limiting (max: 15 requests/minute)
print_color "\nTest 3: Testing Auth rate limiting (sending 20 requests)" "yellow"
for i in {1..20}; do
  response=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Test-IP: test-ip-3" "$BASE_URL/auth/login")
  if [ "$response" = "429" ]; then
    print_color "Request $i received rate limit response (429)" "red"
    # Show the full response with headers for the rate-limited request
    curl -s -i -H "X-Test-IP: test-ip-3" "$BASE_URL/auth/login"
    break
  else
    echo "Request $i: $response"
  fi
  # Speed up testing - don't wait between requests
done

# Small delay between tests
sleep 2

# Test 4: Webhook Exclusion (should never rate limit)
print_color "\nTest 4: Testing webhook exclusion (should never rate limit)" "yellow"
for i in {1..20}; do
  response=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Test-IP: test-ip-4" "$BASE_URL/api/stripe/webhook")
  echo "Webhook Request $i: $response"
  # No need to check for 429 as webhooks should be excluded
done

print_color "\nRate limiting tests completed." "green"
