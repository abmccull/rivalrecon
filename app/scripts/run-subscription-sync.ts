/**
 * One-time script to manually sync all subscriptions with Stripe
 * 
 * Run with: npx ts-node -r tsconfig-paths/register scripts/run-subscription-sync.ts
 */

import { syncAllSubscriptions } from '../src/lib/subscription-sync';

async function main() {
  console.log('Starting manual subscription sync...');
  
  try {
    const result = await syncAllSubscriptions();
    
    console.log('\n==== SYNC COMPLETE ====');
    
    // Handle the case when no subscriptions are found (message only)
    if ('message' in result && result.message === 'No subscriptions found to sync') {
      console.log(result.message);
      return;
    }
    
    // The rest of the properties are available when subscriptions were processed
    if ('totalProcessed' in result) {
      console.log(`Total subscriptions processed: ${result.totalProcessed}`);
      console.log(`Successfully updated: ${result.succeeded}`);
      console.log(`Failed updates: ${result.failed}`);
      
      if (result.details && result.details.length > 0) {
        console.log('\nDetailed Results:');
        result.details.forEach((detail: any, index: number) => {
          console.log(`\n[${index + 1}] User: ${detail.userId}`);
          console.log(`   Stripe Subscription: ${detail.stripeSubscriptionId}`);
          console.log(`   Success: ${detail.success ? 'YES' : 'NO'}`);
          console.log(`   Message: ${detail.message}`);
          
          if (detail.data && detail.data.before && detail.data.after) {
            console.log('   Date Changes:');
            if (detail.data.before.trial_end !== detail.data.after.trial_end) {
              console.log(`     Trial End: ${detail.data.before.trial_end} -> ${detail.data.after.trial_end}`);
            }
            if (detail.data.before.current_period_end !== detail.data.after.current_period_end) {
              console.log(`     Current Period End: ${detail.data.before.current_period_end} -> ${detail.data.after.current_period_end}`);
            }
            if (detail.data.before.status !== detail.data.after.status) {
              console.log(`     Status: ${detail.data.before.status} -> ${detail.data.after.status}`);
            }
          }
        });
      }
    }
    
    // If the operation failed, show the error message
    if (!result.success && 'message' in result) {
      console.error(`\nOverall sync process failed: ${result.message}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Error running subscription sync:', error);
    process.exit(1);
  }
}

// Run the script
main();
