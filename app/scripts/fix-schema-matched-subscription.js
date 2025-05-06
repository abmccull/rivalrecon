/**
 * Script to fix a subscription - using the exact database schema
 * This matches the exact column names from the subscriptions table
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
  console.log(`\n----- SCHEMA-MATCHED SUBSCRIPTION FIX -----`);
  console.log(`Email: ${CUSTOMER_EMAIL}`);
  console.log(`User ID: ${USER_ID}`);

  try {
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
    
    const subscription = subscriptions.data[0];
    console.log(`✅ Found Stripe subscription: ${subscription.id}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Trial end: ${subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : 'None'}`);
    
    // Extract the price ID if available
    let stripePriceId = null;
    if (subscription.items && 
        subscription.items.data && 
        subscription.items.data.length > 0 && 
        subscription.items.data[0].price) {
      stripePriceId = subscription.items.data[0].price.id;
      console.log(`   Price ID: ${stripePriceId}`);
    }
    
    // Check if user has an existing subscription record
    console.log(`\nChecking existing subscription record...`);
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', USER_ID)
      .maybeSingle();
    
    // Create an update object with schema-matching column names
    const updateData = {
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      stripe_price_id: stripePriceId,  // Using correct column name from schema
      status: subscription.status,
      plan_id: 'starter',  // Assuming starter plan based on other records
      updated_at: new Date().toISOString()
    };
    
    // Only add date fields if they exist in the subscription
    if (subscription.trial_start) {
      updateData.trial_start = new Date(subscription.trial_start * 1000).toISOString();
    }
    
    if (subscription.trial_end) {
      updateData.trial_end = new Date(subscription.trial_end * 1000).toISOString();
    }
    
    if (subscription.current_period_start) {
      updateData.current_period_start = new Date(subscription.current_period_start * 1000).toISOString();
    }
    
    if (subscription.current_period_end) {
      updateData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
    }
    
    if (subscription.cancel_at) {
      updateData.cancel_at = new Date(subscription.cancel_at * 1000).toISOString();
    }
    
    if (subscription.canceled_at) {
      updateData.canceled_at = new Date(subscription.canceled_at * 1000).toISOString();
    }
    
    console.log(`\nPrepared update data:`, updateData);
    
    // Handle the update or insert
    if (existingSub) {
      console.log(`\nUpdating existing subscription record: ${existingSub.id}`);
      
      // Keep submission_counter if it exists
      if (existingSub.submission_counter !== null && existingSub.submission_counter !== undefined) {
        updateData.submission_counter = existingSub.submission_counter;
      }
      
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', existingSub.id);
        
      if (updateError) {
        console.error(`❌ Error updating subscription:`, updateError);
      } else {
        console.log(`✅ Successfully updated subscription record`);
      }
    } else {
      console.log(`\nCreating new subscription record for user`);
      
      // Add required fields for a new record
      const newSub = {
        ...updateData,
        user_id: USER_ID,
        created_at: new Date().toISOString()
      };
      
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert(newSub);
        
      if (insertError) {
        console.error(`❌ Error creating subscription record:`, insertError);
      } else {
        console.log(`✅ Successfully created new subscription record`);
      }
    }
    
  } catch (error) {
    console.error('Error fixing subscription:', error);
  }
}

// Run the script
fixSubscription()
  .then(() => console.log('\nSchema-matched subscription fix complete'))
  .catch(console.error);
