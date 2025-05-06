/**
 * Script to verify subscription is correctly synced
 */

// Import required modules
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

// Configure Stripe and Supabase
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// User ID to check
const USER_ID = '1f75b605-e93c-480c-8e34-0687e88f0d12';

async function verifySubscription() {
  console.log(`\n----- VERIFYING SUBSCRIPTION SYNC -----`);
  console.log(`Checking for user: ${USER_ID}`);
  
  try {
    // Get the subscription record from the database
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', USER_ID)
      .single();
      
    if (subError) {
      console.error(`Error fetching subscription:`, subError);
      return;
    }
    
    if (!subscription) {
      console.error(`No subscription found for user ${USER_ID}`);
      return;
    }
    
    console.log(`\nDatabase subscription record:`);
    console.log(`- ID: ${subscription.id}`);
    console.log(`- User ID: ${subscription.user_id}`);
    console.log(`- Stripe Customer ID: ${subscription.stripe_customer_id || 'None'}`);
    console.log(`- Stripe Subscription ID: ${subscription.stripe_subscription_id || 'None'}`);
    console.log(`- Stripe Price ID: ${subscription.stripe_price_id || 'None'}`);
    console.log(`- Status: ${subscription.status}`);
    console.log(`- Plan ID: ${subscription.plan_id || 'None'}`);
    console.log(`- Trial End: ${subscription.trial_end || 'None'}`);
    
    // If no Stripe subscription ID, we can't verify against Stripe
    if (!subscription.stripe_subscription_id) {
      console.log(`\nNo Stripe subscription ID in database, can't verify against Stripe`);
      return;
    }
    
    // Get the subscription from Stripe
    console.log(`\nFetching subscription from Stripe: ${subscription.stripe_subscription_id}`);
    
    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
      );
      
      console.log(`\nStripe subscription data:`);
      console.log(`- ID: ${stripeSubscription.id}`);
      console.log(`- Customer ID: ${stripeSubscription.customer}`);
      console.log(`- Status: ${stripeSubscription.status}`);
      
      // Get the price ID from the subscription
      let stripePriceId = 'None';
      if (stripeSubscription.items && 
          stripeSubscription.items.data && 
          stripeSubscription.items.data.length > 0 && 
          stripeSubscription.items.data[0].price) {
        stripePriceId = stripeSubscription.items.data[0].price.id;
      }
      console.log(`- Price ID: ${stripePriceId}`);
      
      // Format dates for comparison
      const trialEnd = stripeSubscription.trial_end ? 
        new Date(stripeSubscription.trial_end * 1000).toISOString() : 'None';
      console.log(`- Trial End: ${trialEnd}`);
      
      // Check if everything matches
      const matches = {
        subscription_id: stripeSubscription.id === subscription.stripe_subscription_id,
        customer_id: stripeSubscription.customer === subscription.stripe_customer_id,
        status: stripeSubscription.status === subscription.status,
        price_id: stripePriceId === subscription.stripe_price_id
      };
      
      console.log(`\nVerification Results:`);
      console.log(`- Subscription ID: ${matches.subscription_id ? '✅ Match' : '❌ Mismatch'}`);
      console.log(`- Customer ID: ${matches.customer_id ? '✅ Match' : '❌ Mismatch'}`);
      console.log(`- Status: ${matches.status ? '✅ Match' : '❌ Mismatch'}`);
      console.log(`- Price ID: ${matches.price_id ? '✅ Match' : '❌ Mismatch'}`);
      
      const allMatched = Object.values(matches).every(match => match === true);
      
      if (allMatched) {
        console.log(`\n✅ SUCCESS: All subscription data is correctly synced between Stripe and your database!`);
      } else {
        console.log(`\n⚠️ Some subscription data does not match between Stripe and your database.`);
      }
      
    } catch (stripeError) {
      console.error(`Error retrieving subscription from Stripe:`, stripeError);
    }
    
  } catch (error) {
    console.error(`Error verifying subscription:`, error);
  }
}

// Run the verification
verifySubscription()
  .then(() => console.log(`\nVerification complete`))
  .catch(console.error);
