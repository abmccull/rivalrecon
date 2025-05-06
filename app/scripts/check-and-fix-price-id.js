/**
 * Script to specifically check and fix the stripe_price_id field
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

// User and customer details
const USER_ID = '1f75b605-e93c-480c-8e34-0687e88f0d12';
const CUSTOMER_EMAIL = 'handscrapedflooring@gmail.com';

async function checkAndFixPriceId() {
  console.log(`\n----- CHECKING AND FIXING PRICE ID -----`);
  
  try {
    // Step 1: Get the current subscription record
    console.log(`Checking current subscription record for user ${USER_ID}`);
    
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
    
    console.log(`\nCurrent subscription record:`);
    console.log(`- ID: ${subscription.id}`);
    console.log(`- Stripe Customer ID: ${subscription.stripe_customer_id || 'None'}`);
    console.log(`- Stripe Subscription ID: ${subscription.stripe_subscription_id || 'None'}`);
    console.log(`- Stripe Price ID: ${subscription.stripe_price_id || 'None'}`);
    console.log(`- Status: ${subscription.status}`);
    
    // Step 2: Get the price ID from Stripe
    let priceId = null;
    
    if (subscription.stripe_subscription_id) {
      console.log(`\nFetching subscription details from Stripe...`);
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
      );
      
      if (stripeSubscription.items && 
          stripeSubscription.items.data && 
          stripeSubscription.items.data.length > 0 && 
          stripeSubscription.items.data[0].price) {
        priceId = stripeSubscription.items.data[0].price.id;
        console.log(`Found price ID in Stripe: ${priceId}`);
      }
    } else {
      // If no subscription ID in the record, get it from the customer
      console.log(`\nLooking for customer in Stripe...`);
      const customers = await stripe.customers.list({
        email: CUSTOMER_EMAIL
      });
      
      if (customers.data.length === 0) {
        console.error(`No customer found with email ${CUSTOMER_EMAIL}`);
        return;
      }
      
      const customer = customers.data[0];
      console.log(`Found customer: ${customer.id}`);
      
      console.log(`Looking for subscriptions...`);
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 1
      });
      
      if (subscriptions.data.length === 0) {
        console.error(`No subscriptions found for customer ${customer.id}`);
        return;
      }
      
      const stripeSubscription = subscriptions.data[0];
      
      if (stripeSubscription.items && 
          stripeSubscription.items.data && 
          stripeSubscription.items.data.length > 0 && 
          stripeSubscription.items.data[0].price) {
        priceId = stripeSubscription.items.data[0].price.id;
        console.log(`Found price ID in Stripe: ${priceId}`);
      }
    }
    
    if (!priceId) {
      console.error(`Could not find a price ID in Stripe`);
      return;
    }
    
    // Step 3: Try to update just the price ID field
    console.log(`\nAttempting to update ONLY the stripe_price_id field to: ${priceId}`);
    
    // First, check the all column names in the table
    console.log(`\nChecking database table structure...`);
    
    const { data: columns, error: structError } = await supabase
      .rpc('get_table_structure', { table_name: 'subscriptions' })
      .catch(err => {
        console.log(`Error checking table structure:`, err);
        return { data: null, error: err };
      });
    
    if (structError) {
      console.log(`Structure check not available. Proceeding with update.`);
    } else if (columns) {
      console.log(`Table columns:`, columns);
    }
    
    // Try the update with just the price ID
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ stripe_price_id: priceId })
      .eq('id', subscription.id);
      
    if (updateError) {
      console.error(`\n❌ Error updating price ID:`, updateError);
      
      // Try an alternative approach - update multiple fields
      console.log(`\nTrying alternative approach - updating multiple fields...`);
      
      const updateData = {
        stripe_price_id: priceId,
        updated_at: new Date().toISOString()
      };
      
      const { error: altError } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', subscription.id);
        
      if (altError) {
        console.error(`\n❌ Alternative update failed:`, altError);
      } else {
        console.log(`\n✅ Alternative update successful - price ID should be updated`);
      }
    } else {
      console.log(`\n✅ Successfully updated price ID to: ${priceId}`);
    }
    
    // Final check to see if it was updated
    const { data: updatedSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscription.id)
      .single();
      
    if (updatedSub) {
      console.log(`\nUpdated subscription record:`);
      console.log(`- ID: ${updatedSub.id}`);
      console.log(`- Stripe Price ID: ${updatedSub.stripe_price_id || 'None'}`);
      
      if (updatedSub.stripe_price_id === priceId) {
        console.log(`\n✅ Confirmation: Price ID was successfully updated!`);
      } else {
        console.error(`\n❌ Price ID was not updated in the database.`);
      }
    }
    
  } catch (error) {
    console.error(`Error during price ID check/fix:`, error);
  }
}

// Run the function
checkAndFixPriceId()
  .then(() => console.log(`\nCheck and fix process complete`))
  .catch(console.error);
