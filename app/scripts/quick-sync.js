/**
 * Simple script to directly sync subscriptions with Stripe
 * This bypasses TypeScript to avoid type issues
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

async function syncExistingSubscriptions() {
  console.log('Syncing existing subscriptions...');
  
  try {
    // Get all subscriptions with a Stripe subscription ID
    const { data: subscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .not('stripe_subscription_id', 'is', null);
    
    if (fetchError) {
      console.error('Error fetching existing subscriptions:', fetchError);
      return;
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log('No existing subscriptions found to sync');
      return;
    }
    
    console.log(`Found ${subscriptions.length} existing subscriptions to sync`);
    
    // Process each subscription
    for (const subscription of subscriptions) {
      await syncSingleSubscription(subscription);
    }
  } catch (error) {
    console.error('Error syncing existing subscriptions:', error);
  }
}

async function findNewSubscriptionsByEmail() {
  console.log('\nLooking for new subscriptions by email...');
  
  try {
    // Get all users 
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, email');
      
    if (userError) {
      console.error('Error fetching users:', userError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('No users found to check for new subscriptions');
      return;
    }
    
    console.log(`Checking ${users.length} users for new Stripe subscriptions...`);
    
    let newSubscriptionsFound = 0;
    
    // Debug - List all users we're checking
    console.log('User emails being checked:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.id}: ${user.email || 'No email'}`);
    });

    // Specifically check for the handscrapedfloorings@gmail.com customer
    const targetEmail = 'handscrapedfloorings@gmail.com';
    console.log(`\nSpecifically checking for customer with email: ${targetEmail}`);
    
    // First get all customers with this email from Stripe
    const targetCustomers = await stripe.customers.list({
      email: targetEmail
    });
    
    console.log(`Found ${targetCustomers.data.length} customers in Stripe with email ${targetEmail}`);
    
    if (targetCustomers.data.length > 0) {
      // Find the user with this email in our database
      const matchingUser = users.find(u => u.email && u.email.toLowerCase() === targetEmail.toLowerCase());
      
      if (matchingUser) {
        console.log(`Found matching user in database: ${matchingUser.id}`);
        
        // Check if this user already has a subscription record
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', matchingUser.id)
          .single();
          
        if (existingSub) {
          console.log(`User already has a subscription record: ${existingSub.id}`);
        } else {
          console.log(`No existing subscription for user. Creating new record...`);
          
          // Process all subscriptions for this customer
          await processCustomerSubscriptions(targetCustomers.data[0], matchingUser);
          newSubscriptionsFound++;
        }
      } else {
        console.log(`Could not find user with email ${targetEmail} in database`);
      }
    }
    
    // Now check all other users
    // Check each user by email
    for (const user of users) {
      if (!user.email) {
        console.log(`Skipping user ${user.id} - no email address`);
        continue;
      }
      
      // Skip users who already have a subscription
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (existingSub) {
        console.log(`Skipping user ${user.id} - already has subscription ${existingSub.id}`);
        continue;
      }
      
      // Skip the target email as we already processed it
      if (user.email.toLowerCase() === targetEmail.toLowerCase()) {
        continue;
      }
      
      console.log(`Checking for Stripe customer with email: ${user.email}`);
      
      // Look for customer by email in Stripe
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });
      
      if (customers.data.length === 0) {
        console.log(`No Stripe customer found for email: ${user.email}`);
        continue;
      }
      
      const customer = customers.data[0];
      console.log(`Found Stripe customer: ${customer.id}`);
      
      await processCustomerSubscriptions(customer, user);
      newSubscriptionsFound++;
    }
    
    if (newSubscriptionsFound === 0) {
      console.log('No new subscriptions found for any users');
    } else {
      console.log(`✅ Found and processed ${newSubscriptionsFound} users with new subscriptions`);
    }
    
  } catch (error) {
    console.error('Error finding new subscriptions:', error);
  }
}

async function syncSingleSubscription(subscription) {
  console.log(`\nSyncing subscription for user ${subscription.user_id}`);
  console.log(`Stripe subscription ID: ${subscription.stripe_subscription_id}`);
  
  try {
    // Get the latest subscription data directly from Stripe
    console.log(`Fetching latest data from Stripe...`);
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    );
    
    // Print current vs. Stripe data
    console.log('CURRENT DATA:');
    console.log(`- Status: ${subscription.status}`);
    console.log(`- Trial end: ${subscription.trial_end}`);
    console.log(`- Current period end: ${subscription.current_period_end}`);
    
    console.log('STRIPE DATA:');
    console.log(`- Status: ${stripeSubscription.status}`);
    console.log(`- Trial end: ${stripeSubscription.trial_end ? 
      new Date(stripeSubscription.trial_end * 1000).toISOString() : 'None'}`);
    console.log(`- Current period end: ${stripeSubscription.current_period_end ? 
      new Date(stripeSubscription.current_period_end * 1000).toISOString() : 'None'}`);
    
    // Prepare update data
    const updateData = {
      status: stripeSubscription.status,
      current_period_start: stripeSubscription.current_period_start ? 
        new Date(stripeSubscription.current_period_start * 1000).toISOString() : null,
      current_period_end: stripeSubscription.current_period_end ? 
        new Date(stripeSubscription.current_period_end * 1000).toISOString() : null,
      trial_start: stripeSubscription.trial_start ? 
        new Date(stripeSubscription.trial_start * 1000).toISOString() : null,
      trial_end: stripeSubscription.trial_end ? 
        new Date(stripeSubscription.trial_end * 1000).toISOString() : null,
      cancel_at: stripeSubscription.cancel_at ? 
        new Date(stripeSubscription.cancel_at * 1000).toISOString() : null,
      canceled_at: stripeSubscription.canceled_at ? 
        new Date(stripeSubscription.canceled_at * 1000).toISOString() : null,
      updated_at: new Date().toISOString()
    };
    
    // Update the subscription in our database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscription.id);
    
    if (updateError) {
      console.error(`Error updating subscription:`, updateError);
    } else {
      console.log('✓ Successfully synced subscription with Stripe data');
      
      // Show what changed
      if (subscription.trial_end !== updateData.trial_end) {
        console.log(`✓ Updated trial end: ${subscription.trial_end} → ${updateData.trial_end}`);
      }
      
      if (subscription.current_period_end !== updateData.current_period_end) {
        console.log(`✓ Updated current period end: ${subscription.current_period_end} → ${updateData.current_period_end}`);
      }
      
      if (subscription.status !== updateData.status) {
        console.log(`✓ Updated status: ${subscription.status} → ${updateData.status}`);
      }
    }
  } catch (error) {
    console.error(`Error syncing subscription:`, error);
  }
}

async function processCustomerSubscriptions(customer, user) {
  console.log(`\nProcessing subscriptions for customer ${customer.id} (User: ${user.id})`);

  // Look for subscriptions for this customer
  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: 'all',
    limit: 5
  });
  
  if (subscriptions.data.length === 0) {
    console.log(`No subscriptions found for customer ${customer.id}`);
    return;
  }
  
  // Log all found subscriptions
  console.log(`Found ${subscriptions.data.length} subscription(s) in Stripe:`);
  subscriptions.data.forEach((sub, i) => {
    console.log(`${i + 1}. ID: ${sub.id}, Status: ${sub.status}, ` + 
      `Trial: ${sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : 'None'}`);
  });
  
  // Process each subscription from newest to oldest
  for (const stripeSub of subscriptions.data) {
    console.log(`Creating new subscription record for user ${user.id}`);
    console.log(`Stripe subscription ID: ${stripeSub.id}`);
    
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
    
    // Insert the new subscription
    const { error: insertError } = await supabase
      .from('subscriptions')
      .insert(newSubscription);
      
    if (insertError) {
      console.error('Error creating subscription record:', insertError);
    } else {
      console.log('✅ Created new subscription record in database');
      console.log(`   Status: ${stripeSub.status}`);
      console.log(`   Trial end: ${stripeSub.trial_end ? 
        new Date(stripeSub.trial_end * 1000).toISOString() : 'None'}`);
    }
  }
}

async function syncSubscriptions() {
  console.log('Starting subscription sync with Stripe...');
  
  try {
    // First sync existing subscriptions
    await syncExistingSubscriptions();
    
    // Then look for new subscriptions by email
    await findNewSubscriptionsByEmail();
    
    console.log('\nSubscription sync complete!');
  } catch (error) {
    console.error('Error in sync process:', error);
  }
}

// Run the script
syncSubscriptions().catch(console.error);
