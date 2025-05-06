#!/usr/bin/env node

/**
 * Test Stripe Webhook Configuration
 * 
 * This script tests if your Stripe webhook is properly configured.
 * It will check:
 * 1. If your STRIPE_WEBHOOK_SECRET environment variable is set
 * 2. If your webhook endpoints are properly configured in Stripe
 * 3. Verify subscription records in your local database
 * 
 * Run with: node src/scripts/test-stripe-webhook.js
 */

const https = require('https');
const dotenv = require('dotenv');
const { execSync } = require('child_process');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Print a section header
function printHeader(text) {
  console.log('\n' + colors.blue + '='.repeat(50) + colors.reset);
  console.log(colors.blue + '= ' + text + colors.reset);
  console.log(colors.blue + '='.repeat(50) + colors.reset + '\n');
}

// Print a success message
function printSuccess(text) {
  console.log(colors.green + '✓ ' + text + colors.reset);
}

// Print a warning message
function printWarning(text) {
  console.log(colors.yellow + '⚠ ' + text + colors.reset);
}

// Print an error message
function printError(text) {
  console.log(colors.red + '✗ ' + text + colors.reset);
}

// Print an info message
function printInfo(text) {
  console.log(colors.cyan + 'ℹ ' + text + colors.reset);
}

// Check if a string is a valid URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Main function
async function main() {
  console.log(colors.magenta + '\nRivalRecon Stripe Webhook Configuration Test' + colors.reset);
  console.log('This script will check your Stripe webhook configuration\n');

  // Check environment variables
  printHeader('Environment Variables');
  
  if (!process.env.STRIPE_SECRET_KEY) {
    printError('STRIPE_SECRET_KEY is not set in your environment variables');
    process.exit(1);
  } else {
    printSuccess('STRIPE_SECRET_KEY is set');
  }
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    printError('STRIPE_WEBHOOK_SECRET is not set in your environment variables');
    printWarning('You need to set this in your .env.local file');
    printInfo('Go to https://dashboard.stripe.com/webhooks to find your webhook secret');
    process.exit(1);
  } else {
    printSuccess('STRIPE_WEBHOOK_SECRET is set');
  }

  // Print Stripe API info
  printHeader('API Information');
  const apiVersion = process.env.STRIPE_API_VERSION || '2025-04-30.basil';
  printInfo(`Using Stripe API version: ${apiVersion}`);

  // Check current URLs
  printHeader('Application URLs');
  let productionUrl;
  let devUrl;
  
  try {
    const pkg = require(path.resolve(process.cwd(), 'package.json'));
    if (pkg.homepage) {
      productionUrl = pkg.homepage;
      printInfo(`Production URL (from package.json): ${productionUrl}`);
    } else {
      printWarning('No homepage URL found in package.json');
    }
  } catch (error) {
    printWarning('Could not read package.json');
  }
  
  // Try to figure out development URL
  devUrl = 'http://localhost:3000';
  printInfo(`Development URL (assumed): ${devUrl}`);

  printHeader('Webhook Endpoints');
  const prodWebhookEndpoint = `${productionUrl}/api/stripe/webhook`;
  const devWebhookEndpoint = `${devUrl}/api/stripe/webhook`;
  
  if (productionUrl) {
    printInfo(`Production webhook should be configured as: ${prodWebhookEndpoint}`);
  }
  printInfo(`Development webhook should be configured as: ${devWebhookEndpoint}`);
  
  printWarning('You need to verify these endpoints in your Stripe Dashboard:');
  printInfo('1. Go to https://dashboard.stripe.com/webhooks');
  printInfo('2. Make sure you have webhook endpoints configured for both production and development');
  printInfo('3. Ensure the signing secret matches STRIPE_WEBHOOK_SECRET in your environment');
  
  // Check for recent subscriptions in the database
  printHeader('Recent Activity');
  printInfo('To check if webhooks are working, please visit:');
  printInfo('1. Your Stripe Dashboard > Developers > Webhooks');
  printInfo('2. Click on your webhook endpoint');
  printInfo('3. Check "Recent events" to see if events are being sent and received');
  
  printHeader('Next Steps');
  printInfo('1. Manually visit the sync endpoint: /api/subscription/sync');
  printInfo('   This will force your subscription to sync with Stripe');
  printInfo('2. Refresh your app and see if your subscription is recognized');
  printInfo('3. If not, check server logs for webhook errors (see Enhanced logging)');
  
  console.log('\n');
}

// Run the main function
main().catch(error => {
  console.error(colors.red + 'Error: ' + error.message + colors.reset);
  process.exit(1);
});
