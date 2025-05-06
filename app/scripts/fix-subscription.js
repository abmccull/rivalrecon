/**
 * Script to fix a specific subscription for a user
 * Using exact values and compatible with the current database schema
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

// Exact values provided
const CUSTOMER_EMAIL = 'handscrapedflooring@gmail.com';
const USER_ID = '1f75b605-e93c-480c-8e34-0687e88f0d12';

async function fixSubscription() {
  console.log(`\n----- FIXING SUBSCRIPTION FOR USER -----`);
  console.log(`Email: ${CUSTOMER_EMAIL}`);
  console.log(`User ID: ${USER_ID}`);

  try {
    // Verify the user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', USER_ID)
      .single();
      
    if (userError || !user) {
      console.error(`❌ Error finding user in Supabase:`, userError || 'User not found');
      return;
    }
    
    console.log(`✅ Found user in Supabase: ${user.id} (${user.email})`);
    
    // Find the customer in Stripe
    console.log(`\nLooking for Stripe customer with email: ${CUSTOMER_EMAIL}`);
    const customers = await stripe.customers.list({
      email: CUSTOMER_EMAIL
    });
    
    if (customers.data.length === 0) {
      console.error(`❌ No Stripe customer found with email ${CUSTOMER_EMAIL}`);
      return;
    }
    
    const customer = customers.data[0];
    console.log(`✅ Found Stripe customer: ${customer.id}`);
    
    // Get subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 5
    });
    
    if (subscriptions.data.length === 0) {
      console.error(`❌ No subscriptions found for customer ${customer.id}`);
      return;
    }
    
    console.log(`\n✅ Found ${subscriptions.data.length} subscription(s) in Stripe:`);
    
    // Log all subscriptions
    subscriptions.data.forEach((sub, i) => {
      console.log(`   ${i + 1}. ID: ${sub.id}`);
      console.log(`      Status: ${sub.status}`);
      console.log(`      Trial ends: ${sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : 'None'}`);
      console.log(`      Created: ${new Date(sub.created * 1000).toISOString()}`);
    });
    
    // Use the most recent subscription (first in the list)
    const subscription = subscriptions.data[0];
    console.log(`\nUsing subscription: ${subscription.id}`);
    
    // Get all columns in the subscriptions table
    console.log(`\nChecking subscription record for user...`);
    const { data: existingSub, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', USER_ID)
      .maybeSingle();
      
    if (subError) {
      console.error(`❌ Error checking for subscription:`, subError);
      return;
    }
    
    // First create a clean update data object with only the values we're sure about
    const basicUpdateData = {
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: subscription.current_period_start ? 
        new Date(subscription.current_period_start * 1000).toISOString() : null,
      current_period_end: subscription.current_period_end ? 
        new Date(subscription.current_period_end * 1000).toISOString() : null,
      trial_start: subscription.trial_start ? 
        new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? 
        new Date(subscription.trial_end * 1000).toISOString() : null,
      canceled_at: subscription.canceled_at ? 
        new Date(subscription.canceled_at * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
      customer_email: customer.email || null,
      customer_name: customer.name || null
    };
    
    // Try to get the price_id if it exists in the subscription
    if (subscription.items && 
        subscription.items.data && 
        subscription.items.data.length > 0 && 
        subscription.items.data[0].price && 
        subscription.items.data[0].price.id) {
      basicUpdateData.price_id = subscription.items.data[0].price.id;
    }
    
    // Conditionally add other fields if they're present in the subscription
    if (subscription.cancel_at_period_end !== undefined) {
      basicUpdateData.cancel_at_period_end = subscription.cancel_at_period_end;
    }
    
    if (subscription.cancel_at) {
      basicUpdateData.cancel_at = new Date(subscription.cancel_at * 1000).toISOString();
    }
    
    console.log(`\nPrepared subscription data:`);
    console.log(JSON.stringify(basicUpdateData, null, 2));
    
    if (existingSub) {
      console.log(`\n⚠️ User already has subscription record: ${existingSub.id}`);
      
      if (existingSub.stripe_subscription_id) {
        console.log(`Existing Stripe subscription ID: ${existingSub.stripe_subscription_id}`);
      } else {
        console.log(`No existing Stripe subscription ID`);
      }
      
      console.log(`New Stripe subscription ID: ${subscription.id}`);
      console.log(`\nUpdating subscription record...`);
      
      // Update the existing subscription
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(basicUpdateData)
        .eq('id', existingSub.id);
        
      if (updateError) {
        console.error(`❌ Error updating subscription:`, updateError);
      } else {
        console.log(`✅ Successfully updated subscription record`);
      }
    } else {
      console.log(`\nCreating new subscription record for user ${USER_ID}`);
      
      // Create a new subscription with all required fields
      const newSubscription = {
        ...basicUpdateData,
        user_id: USER_ID,
        created_at: new Date().toISOString()
      };
      
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert(newSubscription);
        
      if (insertError) {
        console.error(`❌ Error creating subscription record:`, insertError);
      } else {
        console.log(`✅ Successfully created new subscription record`);
        console.log(`   Status: ${subscription.status}`);
        console.log(`   Trial end: ${subscription.trial_end ? 
          new Date(subscription.trial_end * 1000).toISOString() : 'None'}`);
      }
    }
  } catch (error) {
    console.error('Error fixing subscription:', error);
  }
}

// Run the script
fixSubscription()
  .then(() => console.log('\nSubscription fix process complete'))
  .catch(console.error);
