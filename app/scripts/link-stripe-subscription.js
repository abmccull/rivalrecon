/**
 * Script to link an existing Stripe subscription to a user in our database
 * Handles cases where emails don't match
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

// Get command line arguments
const args = process.argv.slice(2);
const STRIPE_EMAIL = args[0] || 'handscrapedfloorings@gmail.com';
const USER_ID = args[1]; // Optional user ID to link to

async function linkStripeSubscription() {
  console.log(`\n----- STRIPE SUBSCRIPTION LINKER -----`);
  console.log(`Looking for Stripe customer with email: ${STRIPE_EMAIL}`);

  try {
    // Step 1: Find the Stripe customer
    const customers = await stripe.customers.list({
      email: STRIPE_EMAIL,
      limit: 3
    });
    
    if (customers.data.length === 0) {
      console.error(`❌ No Stripe customer found with email ${STRIPE_EMAIL}`);
      return;
    }
    
    const customer = customers.data[0];
    console.log(`✅ Found Stripe customer: ${customer.id}`);
    
    // Step 2: Get subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 5
    });
    
    if (subscriptions.data.length === 0) {
      console.error(`❌ No subscriptions found for customer ${customer.id}`);
      return;
    }
    
    console.log(`✅ Found ${subscriptions.data.length} subscription(s) in Stripe:`);
    
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
    
    // Step 3: Find or specify the user to link it to
    let userId = USER_ID;
    
    if (!userId) {
      // First try to find a user with the exact same email
      const { data: exactUser } = await supabase
        .from('profiles')
        .select('id, email')
        .ilike('email', STRIPE_EMAIL)
        .maybeSingle();
        
      if (exactUser) {
        console.log(`✅ Found exact email match in database: ${exactUser.id} (${exactUser.email})`);
        userId = exactUser.id;
      } else {
        // List all users so the caller can choose one
        console.log(`\n❌ No user found with email ${STRIPE_EMAIL} in our database`);
        console.log(`Available users in the database:`);
        
        const { data: allUsers } = await supabase
          .from('profiles')
          .select('id, email');
          
        if (allUsers && allUsers.length > 0) {
          allUsers.forEach((user, i) => {
            console.log(`   ${i + 1}. ID: ${user.id}, Email: ${user.email || 'None'}`);
          });
          
          console.log(`\nTo link this subscription to a specific user, run:`);
          console.log(`node scripts/link-stripe-subscription.js "${STRIPE_EMAIL}" USER_ID`);
          console.log(`Replace USER_ID with one of the IDs listed above.`);
        } else {
          console.log(`No users found in the database.`);
        }
        
        return;
      }
    } else {
      // Verify that the specified user exists
      const { data: user, error } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', userId)
        .single();
        
      if (error || !user) {
        console.error(`❌ User with ID ${userId} not found in database`);
        return;
      }
      
      console.log(`✅ Found specified user in database: ${user.id} (${user.email})`);
    }
    
    // Step 4: Check if this user already has a subscription
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, stripe_subscription_id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (existingSub) {
      console.log(`\n⚠️ User already has subscription record: ${existingSub.id}`);
      console.log(`Existing Stripe subscription ID: ${existingSub.stripe_subscription_id}`);
      console.log(`New Stripe subscription ID: ${subscription.id}`);
      
      if (existingSub.stripe_subscription_id === subscription.id) {
        console.log(`\nSubscription IDs match. Updating status and dates...`);
      } else {
        console.log(`\nSubscription IDs differ. Updating to new subscription...`);
      }
      
      // Update the existing subscription record
      const updateData = {
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        price_id: subscription.items.data[0]?.price.id || null,
        current_period_start: subscription.current_period_start ? 
          new Date(subscription.current_period_start * 1000).toISOString() : null,
        current_period_end: subscription.current_period_end ? 
          new Date(subscription.current_period_end * 1000).toISOString() : null,
        trial_start: subscription.trial_start ? 
          new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? 
          new Date(subscription.trial_end * 1000).toISOString() : null,
        cancel_at: subscription.cancel_at ? 
          new Date(subscription.cancel_at * 1000).toISOString() : null,
        canceled_at: subscription.canceled_at ? 
          new Date(subscription.canceled_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      };
      
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
      console.log(`\nCreating new subscription record for user ${userId}`);
      
      // Create a new subscription record
      const newSubscription = {
        user_id: userId,
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        price_id: subscription.items.data[0]?.price.id || null,
        current_period_start: subscription.current_period_start ? 
          new Date(subscription.current_period_start * 1000).toISOString() : null,
        current_period_end: subscription.current_period_end ? 
          new Date(subscription.current_period_end * 1000).toISOString() : null,
        trial_start: subscription.trial_start ? 
          new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? 
          new Date(subscription.trial_end * 1000).toISOString() : null,
        cancel_at: subscription.cancel_at ? 
          new Date(subscription.cancel_at * 1000).toISOString() : null,
        canceled_at: subscription.canceled_at ? 
          new Date(subscription.canceled_at * 1000).toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
    console.error('Error linking subscription:', error);
  }
}

// Run the script
linkStripeSubscription()
  .then(() => console.log('\nSubscription linking process complete'))
  .catch(console.error);
