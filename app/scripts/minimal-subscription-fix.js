/**
 * Minimal script to fix a subscription - only using essential fields
 * that we know exist in the database schema
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
  console.log(`\n----- MINIMAL SUBSCRIPTION FIX -----`);
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
    
    // Check if user has an existing subscription record
    console.log(`\nChecking existing subscription record...`);
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', USER_ID)
      .maybeSingle();
    
    // Create a very minimal update with only core fields
    const minimalData = {
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      updated_at: new Date().toISOString()
    };
    
    // Only add date fields if they exist in the subscription
    if (subscription.trial_start) {
      minimalData.trial_start = new Date(subscription.trial_start * 1000).toISOString();
    }
    
    if (subscription.trial_end) {
      minimalData.trial_end = new Date(subscription.trial_end * 1000).toISOString();
    }
    
    // Handle the update or insert
    if (existingSub) {
      console.log(`\nUpdating existing subscription record: ${existingSub.id}`);
      
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(minimalData)
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
        ...minimalData,
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
  .then(() => console.log('\nMinimal subscription fix complete'))
  .catch(console.error);
