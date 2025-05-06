/**
 * A simple script to sync a specific subscription by email
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

// The specific email we're looking for
const TARGET_EMAIL = 'handscrapedfloorings@gmail.com';

async function syncTargetUser() {
  console.log(`Searching for user with email: ${TARGET_EMAIL}`);

  try {
    // Step 1: Find the user in our database
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .ilike('email', TARGET_EMAIL);
      
    if (userError) {
      console.error('Error fetching user:', userError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.error(`No user found with email ${TARGET_EMAIL} in our database`);
      return;
    }
    
    const user = users[0];
    console.log(`Found user in database: ${user.id} (${user.email})`);
    
    // Step 2: Check if this user already has a subscription
    const { data: existingSub, error: subError } = await supabase
      .from('subscriptions')
      .select('id, stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (subError) {
      console.error('Error checking for existing subscription:', subError);
      return;
    }
    
    // Step 3: Find the customer in Stripe
    console.log(`Looking for Stripe customer with email: ${TARGET_EMAIL}`);
    const customers = await stripe.customers.list({
      email: TARGET_EMAIL
    });
    
    if (customers.data.length === 0) {
      console.error(`No Stripe customer found with email ${TARGET_EMAIL}`);
      return;
    }
    
    const customer = customers.data[0];
    console.log(`Found Stripe customer: ${customer.id}`);
    
    // Step 4: Get subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 5
    });
    
    if (subscriptions.data.length === 0) {
      console.error(`No subscriptions found for customer ${customer.id}`);
      return;
    }
    
    console.log(`Found ${subscriptions.data.length} subscription(s) in Stripe for ${TARGET_EMAIL}:`);
    
    // Log all subscriptions
    subscriptions.data.forEach((sub, i) => {
      console.log(`${i + 1}. ID: ${sub.id}, Status: ${sub.status}, ` +
        `Trial ends: ${sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : 'None'}`);
    });
    
    // Step 5: Process the first subscription (most recent)
    const stripeSub = subscriptions.data[0];
    
    if (existingSub) {
      console.log(`User already has subscription record: ${existingSub.id}`);
      
      if (existingSub.stripe_subscription_id === stripeSub.id) {
        console.log('Subscription record already exists with the correct ID. Updating status and dates...');
        
        // Update the existing subscription
        const updateData = {
          status: stripeSub.status,
          current_period_start: stripeSub.current_period_start ? 
            new Date(stripeSub.current_period_start * 1000).toISOString() : null,
          current_period_end: stripeSub.current_period_end ? 
            new Date(stripeSub.current_period_end * 1000).toISOString() : null,
          trial_start: stripeSub.trial_start ? 
            new Date(stripeSub.trial_start * 1000).toISOString() : null,
          trial_end: stripeSub.trial_end ? 
            new Date(stripeSub.trial_end * 1000).toISOString() : null,
          cancel_at: stripeSub.cancel_at ? 
            new Date(stripeSub.cancel_at * 1000).toISOString() : null,
          canceled_at: stripeSub.canceled_at ? 
            new Date(stripeSub.canceled_at * 1000).toISOString() : null,
          updated_at: new Date().toISOString()
        };
        
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update(updateData)
          .eq('id', existingSub.id);
          
        if (updateError) {
          console.error('Error updating subscription:', updateError);
        } else {
          console.log('✅ Successfully updated subscription record');
        }
      } else {
        console.log(`Existing subscription has different Stripe ID: ${existingSub.stripe_subscription_id}`);
        console.log(`Would you like to update it to the new ID (${stripeSub.id})? Use --force to update.`);
      }
    } else {
      console.log(`Creating new subscription record for user ${user.id}`);
      
      // Create a new subscription record
      const newSubscription = {
        user_id: user.id,
        stripe_customer_id: customer.id,
        stripe_subscription_id: stripeSub.id,
        status: stripeSub.status,
        price_id: stripeSub.items.data[0]?.price.id || null,
        current_period_start: stripeSub.current_period_start ? 
          new Date(stripeSub.current_period_start * 1000).toISOString() : null,
        current_period_end: stripeSub.current_period_end ? 
          new Date(stripeSub.current_period_end * 1000).toISOString() : null,
        trial_start: stripeSub.trial_start ? 
          new Date(stripeSub.trial_start * 1000).toISOString() : null,
        trial_end: stripeSub.trial_end ? 
          new Date(stripeSub.trial_end * 1000).toISOString() : null,
        cancel_at: stripeSub.cancel_at ? 
          new Date(stripeSub.cancel_at * 1000).toISOString() : null,
        canceled_at: stripeSub.canceled_at ? 
          new Date(stripeSub.canceled_at * 1000).toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert(newSubscription);
        
      if (insertError) {
        console.error('Error creating subscription record:', insertError);
      } else {
        console.log('✅ Successfully created new subscription record');
        console.log(`   Status: ${stripeSub.status}`);
        console.log(`   Trial end: ${stripeSub.trial_end ? 
          new Date(stripeSub.trial_end * 1000).toISOString() : 'None'}`);
      }
    }
    
  } catch (error) {
    console.error('Error syncing target user:', error);
  }
}

// Run the sync
syncTargetUser()
  .then(() => console.log('Completed target user sync'))
  .catch(console.error);
