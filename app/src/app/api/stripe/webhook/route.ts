import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordNewTrial, updateTrialStatus } from '@/lib/trial-management';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil' as any,
});

// Enhanced types for Stripe objects with proper property types
type EnhancedSubscription = Stripe.Subscription & {
  current_period_end?: number | null;
};

type EnhancedInvoice = Stripe.Invoice & {
  subscription?: string;
  payment_intent?: string;
  last_payment_error?: {
    message: string;
  };
};

/**
 * Handles Stripe webhook events
 */
export async function POST(request: NextRequest) {
  console.log('🔔 Webhook received!');
  
  const signature = request.headers.get('stripe-signature');
  
  if (!signature) {
    console.error('❌ Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }
  
  // Get the raw body as text
  const body = await request.text();
  
  let event: Stripe.Event;
  
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ STRIPE_WEBHOOK_SECRET is not defined in environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    console.log('🔐 Attempting to verify webhook signature...');
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log(`✅ Webhook verified! Event type: ${event.type}`);
  } catch (error: any) {
    console.error(`❌ Webhook signature verification failed: ${error.message}`);
    console.error('This could be due to:');
    console.error('1. Incorrect webhook secret in environment variables');
    console.error('2. Webhook was not sent by Stripe');
    console.error('3. Request was tampered with during transmission');
    console.error('Make sure your STRIPE_WEBHOOK_SECRET matches what\'s in your Stripe Dashboard');
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  try {
    console.log(`🧩 Processing webhook event: ${event.type} (${event.id})`);
    console.log(`📊 Event data:`, JSON.stringify(event.data.object, null, 2));
    
    // Get Supabase client
    const supabase = await createClient();
    console.log('🔌 Connected to Supabase');
    
    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created': {
        console.log('💫 New subscription created event detected');
        const subscription = event.data.object as EnhancedSubscription;
        
        // Check if this subscription has a trial
        const hasTrial = subscription.status === 'trialing' && subscription.trial_end;
        console.log(`🔍 Subscription info: ID=${subscription.id}, Status=${subscription.status}, HasTrial=${hasTrial}`);
        console.log(`🧑‍💻 User ID from metadata: ${subscription.metadata?.user_id || 'NOT FOUND'}`);
        
        if (hasTrial) {
          // Extract user_id from the subscription metadata
          const userId = subscription.metadata?.user_id;
          
          if (userId && subscription.trial_end) {
            // Record the trial in our database
            const trialEndDate = new Date(subscription.trial_end * 1000);
            await recordNewTrial(userId, trialEndDate);
            console.log(`Recorded new trial for user ${userId} ending on ${trialEndDate.toISOString()}`);
          }
        }
        
        // Record the subscription in our subscriptions table
        console.log('💾 Saving subscription to database...');
        const { error } = await supabase.from('subscriptions').insert({
          user_id: subscription.metadata?.user_id,
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          status: subscription.status,
          price_id: (subscription.items.data[0]?.price.id) || null,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString() 
            : null,
        });
        
        if (error) {
          console.error('❌ Error saving subscription:', error);
        } else {
          console.log('✅ Subscription saved successfully!');
        }
        
        break;
      }
      
      case 'customer.subscription.updated': {
        console.log('🔄 Subscription updated event detected');
        const subscription = event.data.object as EnhancedSubscription;
        const userId = subscription.metadata?.user_id;
        console.log(`🔍 Updated subscription: ID=${subscription.id}, Status=${subscription.status}, UserId=${userId || 'NOT FOUND'}`);
        console.log('Previous attributes:', JSON.stringify(event.data.previous_attributes, null, 2));
        
        // If trial ended and went to active, update trial status
        if (subscription.status === 'active' && userId) {
          const previousAttributes = event.data.previous_attributes as any;
          
          if (previousAttributes?.status === 'trialing') {
            // Trial converted to a paid subscription
            await updateTrialStatus(userId, 'upgraded');
            console.log(`User ${userId} upgraded from trial to paid subscription`);
          }
        }
        
        // First, check if the subscription exists in our database
        console.log('🔍 Checking if subscription already exists in database...');
        const { data: existingSubscription, error: fetchError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('stripe_subscription_id', subscription.id)
          .single();
          
        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 is the "no rows returned" error, which is expected if subscription doesn't exist
          console.error('❌ Error checking for existing subscription:', fetchError);
        }
        
        // If subscription doesn't exist in our database, create it instead of updating
        if (!existingSubscription) {
          console.log('🆕 Subscription not found in database, creating new record...');
          const { error: insertError } = await supabase.from('subscriptions').insert({
            user_id: subscription.metadata?.user_id,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            price_id: (subscription.items.data[0]?.price.id) || null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_end: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString() 
              : null,
          });
          
          if (insertError) {
            console.error('❌ Error creating new subscription record:', insertError);
          } else {
            console.log('✅ New subscription record created successfully!');
          }
        } else {
          // Update existing subscription in the database
          console.log('💾 Updating existing subscription record...');
          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: subscription.status,
              cancel_at_period_end: subscription.cancel_at_period_end,
              current_period_end: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString() 
                : null,
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', subscription.id);
          
          if (error) {
            console.error('❌ Error updating subscription:', error);
          } else {
            console.log('✅ Subscription updated successfully!');
          }
        }
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        console.log('🚫 Subscription deleted event detected');
        const subscription = event.data.object as EnhancedSubscription;
        const userId = subscription.metadata?.user_id;
        console.log(`🔍 Canceled subscription: ID=${subscription.id}, UserId=${userId || 'NOT FOUND'}`);
        
        // If previous status was trialing, mark trial as completed
        if (userId) {
          const previousAttributes = event.data.previous_attributes as any;
          
          if (previousAttributes?.status === 'trialing' || subscription.status === 'trialing') {
            await updateTrialStatus(userId, 'canceled');
            console.log(`🗑 Trial canceled for user ${userId}`);
          }
        }
        
        // Update subscription in the database
        console.log('💾 Marking subscription as canceled in database...');
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        
        if (error) {
          console.error('❌ Error updating subscription:', error);
        } else {
          console.log('✅ Subscription marked as canceled successfully!');
        }
        
        break;
      }
      
      case 'invoice.paid': {
        console.log('💳 Invoice paid event detected');
        const invoice = event.data.object as EnhancedInvoice;
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer as string;
        
        if (!subscriptionId) {
          console.log('ℹ️ This invoice is not associated with a subscription, skipping');
          break;
        }
        
        console.log(`🔍 Invoice info: ID=${invoice.id}, SubscriptionID=${subscriptionId}, Amount=${invoice.amount_paid}`);
        
        // Update subscription record with latest payment information
        try {
          // First, check if this subscription exists in our database
          const { data: existingSubscription, error: fetchError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('stripe_subscription_id', subscriptionId)
            .single();
          
          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('❌ Error fetching subscription:', fetchError);
            break;
          }
          
          if (!existingSubscription) {
            console.log(`ℹ️ Subscription ${subscriptionId} not found in database, fetching from Stripe...`);
            
            // Fetch full subscription details from Stripe
            const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
            const enhancedSubscription = stripeSubscription as EnhancedSubscription;
            
            // Insert the subscription in our database
            const { error: insertError } = await supabase.from('subscriptions').insert({
              user_id: stripeSubscription.metadata?.user_id,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              status: stripeSubscription.status,
              price_id: (stripeSubscription.items.data[0]?.price.id) || null,
              trial_end: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000).toISOString() : null,
              cancel_at_period_end: stripeSubscription.cancel_at_period_end,
              current_period_end: enhancedSubscription.current_period_end
                ? new Date(enhancedSubscription.current_period_end * 1000).toISOString() 
                : null,
              last_payment_date: new Date(invoice.status_transitions?.paid_at || Date.now()).toISOString(),
              last_invoice_id: invoice.id
            });
            
            if (insertError) {
              console.error('❌ Error creating subscription record:', insertError);
            } else {
              console.log('✅ Subscription record created with payment information!');
            }
          } else {
            // Update the existing subscription with payment information
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                status: 'active', // Ensure status is active since payment succeeded
                last_payment_date: new Date(invoice.status_transitions?.paid_at || Date.now()).toISOString(),
                last_invoice_id: invoice.id,
                updated_at: new Date().toISOString()
              })
              .eq('stripe_subscription_id', subscriptionId);
            
            if (updateError) {
              console.error('❌ Error updating subscription payment info:', updateError);
            } else {
              console.log('✅ Subscription payment information updated successfully!');
            }
          }
          
          // Optionally record the payment in a separate payments table
          // This can be useful for tracking payment history
          try {
            // First check if we need to create the payments table
            const { error: tableCheckError } = await supabase
              .from('payments')
              .select('id')
              .limit(1);
              
            if (tableCheckError) {
              console.log('⚠️ Payments table might not exist, attempting to record payment directly');
            }
            
            const { error: paymentError } = await supabase
              .from('payments')
              .upsert({
                user_id: existingSubscription?.user_id,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                stripe_invoice_id: invoice.id,
                amount: invoice.amount_paid,
                currency: invoice.currency,
                payment_date: new Date(invoice.status_transitions?.paid_at || Date.now()).toISOString(),
                payment_method: invoice.payment_intent,
                status: 'succeeded'
              });
            
            if (paymentError) {
              console.error('❌ Error recording payment:', paymentError);
            } else {
              console.log('✅ Payment record created successfully!');
            }
          } catch (paymentError: any) {
            console.error('❌ Could not record payment:', paymentError?.message);
          }
          
        } catch (error: any) {
          console.error(`❌ Error processing invoice.paid event: ${error.message}`);
          console.error(error.stack);
        }
        
        break;
      }
      
      case 'invoice.payment_failed': {
        console.log('🚨 Invoice payment failed event detected');
        const invoice = event.data.object as EnhancedInvoice;
        const subscriptionId = invoice.subscription;
        
        if (!subscriptionId) {
          console.log('ℹ️ This invoice is not associated with a subscription, skipping');
          break;
        }
        
        console.log(`🔍 Failed invoice: ID=${invoice.id}, SubscriptionID=${subscriptionId}`);
        
        try {
          // Update subscription status to reflect payment failure
          const { data: currentSubscription, error: fetchError } = await supabase
            .from('subscriptions')
            .select('payment_failure_count')
            .eq('stripe_subscription_id', subscriptionId)
            .single();
            
          if (fetchError) {
            console.error('❌ Error fetching current subscription:', fetchError);
          }
          
          const failureCount = (currentSubscription?.payment_failure_count || 0) + 1;
          
          const { error } = await supabase
            .from('subscriptions')
            .update({
              payment_failure_count: failureCount,
              last_payment_error: invoice.last_payment_error?.message || 'Payment failed',
              last_payment_attempt: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', subscriptionId);
          
          if (error) {
            console.error('❌ Error updating subscription payment failure:', error);
          } else {
            console.log('✅ Subscription payment failure recorded!');
          }
          
        } catch (error: any) {
          console.error(`❌ Error processing invoice.payment_failed event: ${error.message}`);
        }
        
        break;
      }
      
      case 'customer.updated': {
        console.log('📝 Customer updated event detected');
        const customer = event.data.object as Stripe.Customer;
        
        try {
          // Update customer information in our database if needed
          // This might be in a separate customers table or in the user profile
          console.log(`🔍 Customer updated: ID=${customer.id}, Email=${customer.email}`);
          
          // Update any subscriptions associated with this customer
          const { error } = await supabase
            .from('subscriptions')
            .update({
              customer_email: customer.email,
              customer_name: customer.name,
              updated_at: new Date().toISOString()
            })
            .eq('stripe_customer_id', customer.id);
          
          if (error) {
            console.error('❌ Error updating customer information:', error);
          } else {
            console.log('✅ Customer information updated successfully!');
          }
          
        } catch (error: any) {
          console.error(`❌ Error processing customer.updated event: ${error.message}`);
        }
        
        break;
      }
    }
    
    console.log('✅ Webhook processed successfully');
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`❌ Webhook processing error: ${error.message}`);
    console.error(error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
