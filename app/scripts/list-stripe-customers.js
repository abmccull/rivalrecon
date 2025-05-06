/**
 * Script to list all Stripe customers and subscriptions
 */

// Import required modules
const Stripe = require('stripe');

// Configure Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function listStripeCustomers() {
  console.log('\n----- STRIPE CUSTOMERS -----');

  try {
    // List all customers, up to 100
    const customers = await stripe.customers.list({
      limit: 100
    });
    
    if (customers.data.length === 0) {
      console.log('No customers found in Stripe');
      return;
    }
    
    console.log(`Found ${customers.data.length} customers in Stripe\n`);
    
    // Process each customer
    for (const customer of customers.data) {
      console.log(`Customer ID: ${customer.id}`);
      console.log(`Name: ${customer.name || 'N/A'}`);
      console.log(`Email: ${customer.email || 'N/A'}`);
      console.log(`Created: ${new Date(customer.created * 1000).toISOString()}`);
      
      // Get subscriptions for this customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'all',
        limit: 5
      });
      
      if (subscriptions.data.length > 0) {
        console.log(`Found ${subscriptions.data.length} subscription(s):`);
        
        subscriptions.data.forEach((sub, i) => {
          console.log(`  ${i + 1}. ID: ${sub.id}`);
          console.log(`     Status: ${sub.status}`);
          console.log(`     Trial ends: ${sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : 'None'}`);
        });
      } else {
        console.log('No subscriptions found for this customer');
      }
      
      console.log('-'.repeat(50));
    }
  } catch (error) {
    console.error('Error listing Stripe customers:', error);
  }
}

// Run the script
listStripeCustomers()
  .then(() => console.log('Completed listing Stripe customers'))
  .catch(console.error);
