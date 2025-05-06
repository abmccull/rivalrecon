import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import stripe from '@/lib/stripe-server';

// Use the service role to bypass RLS policies for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.text();
    // Get Stripe signature from request headers
    const signature = request.headers.get('Stripe-Signature');
    
    // Debug logging to ensure webhook is being called
    console.log('Received Stripe webhook event');
    
    if (!signature) {
      console.error('No Stripe signature found in request headers');
      return NextResponse.json(
        { error: 'No Stripe signature found in request' },
        { status: 400 }
      );
    }
    
    let event;
    
    // Check if webhook secret is configured
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured in environment variables');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      // Log the event type for debugging
      console.log(`✅ Successfully verified webhook: ${event.type}`);
    } catch (error: any) {
      console.error(`❌ Webhook signature verification failed: ${error.message}`);
      // Log more details about the error
      console.error(`Stripe-Signature: ${signature?.substring(0, 20)}...`); // Only log part of signature for security
      console.error(`Webhook Secret configured: ${process.env.STRIPE_WEBHOOK_SECRET ? 'Yes' : 'No'}`);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${error.message}` },
        { status: 400 }
      );
    }
    
    // Handle different webhook events
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Processing subscription event: ${event.type}`);
        await handleSubscriptionChange(subscription);
        break;
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as any; // Use any temporarily to handle Stripe type inconsistencies
        if (invoice && invoice.subscription) {
          console.log(`Processing successful payment for subscription: ${invoice.subscription}`);
          // Fetch the subscription to get updated data
          try {
            const subscription = await stripe.subscriptions.retrieve(String(invoice.subscription));
            await handleSubscriptionChange(subscription);
          } catch (error) {
            console.error(`Error retrieving subscription for invoice ${invoice.id}:`, error);
          }
        }
        break;
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as any; // Use any temporarily to handle Stripe type inconsistencies
        if (failedInvoice && failedInvoice.subscription) {
          console.log(`Payment failed for subscription: ${failedInvoice.subscription}`);
          try {
            const subscription = await stripe.subscriptions.retrieve(String(failedInvoice.subscription));
            await handleSubscriptionChange(subscription);
          } catch (error) {
            console.error(`Error retrieving subscription for failed invoice ${failedInvoice.id}:`, error);
          }
        }
        break;
      case 'invoice.finalized':
      case 'invoice.paid':
      case 'payment_intent.created':
      case 'payment_intent.succeeded':
        // We acknowledge these events but don't need special handling
        console.log(`Acknowledged event type: ${event.type}`);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handles subscription created or updated events
 */
async function handleSubscriptionChange(subscription: any) {
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const priceId = subscription.items.data[0].price.id;
  
  // Get plan ID from subscription metadata or price metadata
  let planId = subscription.metadata?.planId;
  
  if (!planId) {
    // Try to get plan ID from price metadata in Stripe
    const price = await stripe.prices.retrieve(priceId);
    planId = price.metadata?.plan_id || 'starter';
  }
  
  // Find customer in database
  const { data: customerData, error: customerError } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  
  if (customerError) {
    console.error('Error finding customer:', customerError);
    return;
  }
  
  // Prepare common update fields
  const updateData = {
    stripe_subscription_id: subscriptionId,
    stripe_price_id: priceId,
    status,
    plan_id: planId,
    current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
    current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
    cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  
  // If customer exists, update subscription
  if (customerData?.user_id) {
    await supabaseAdmin
      .from('subscriptions')
      .update(updateData)
      .eq('id', customerData.id);
  } else {
    // Customer not found, get user ID from subscription metadata
    const userId = subscription.metadata?.userId;
    
    if (!userId) {
      console.error('No user ID found in subscription metadata');
      return;
    }
    
    // Insert new subscription
    await supabaseAdmin
      .from('subscriptions')
      .insert({
        id: crypto.randomUUID(),
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: priceId,
        plan_id: planId,
        status,
        current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
        current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
        cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        submission_counter: 0
      });
  }
  
  // Log the event
  console.log(`Subscription ${status} for customer ${customerId}, plan: ${planId}`);
}

/**
 * Handles subscription canceled events
 */
async function handleSubscriptionCanceled(subscription: any) {
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;
  
  // Update subscription status to canceled
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId)
    .eq('stripe_subscription_id', subscriptionId);
    
  if (error) {
    console.error('Error canceling subscription:', error);
  } else {
    console.log(`Subscription canceled for customer ${customerId}`);
  }
}

/**
 * Handles successful invoice payment
 */
async function handleInvoicePaymentSucceeded(invoice: any) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;
  
  // Get subscription from Stripe to get latest status
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  if (
    invoice.billing_reason === 'subscription_create' || 
    invoice.billing_reason === 'subscription_update' ||
    invoice.billing_reason === 'subscription_cycle'
  ) {
    // Extract the status and period details from the retrieved subscription
    const subData = subscription as any;
    
    // Update subscription status and period info
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: subData.status,
        current_period_start: subData.current_period_start ? new Date(subData.current_period_start * 1000).toISOString() : null,
        current_period_end: subData.current_period_end ? new Date(subData.current_period_end * 1000).toISOString() : null, 
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);
      
    if (error) {
      console.error('Error updating subscription after payment success:', error);
    } else {
      console.log(`Payment succeeded for subscription ${subscriptionId}`);
    }
  }
}

/**
 * Handles failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: any) {
  const subscriptionId = invoice.subscription;
  
  if (!subscriptionId) return;
  
  // Get the customer ID from the invoice
  const customerId = invoice.customer;
  
  // Update subscription status to past_due
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);
    
  if (error) {
    console.error('Error updating subscription after payment failure:', error);
  } else {
    console.log(`Payment failed for subscription ${subscriptionId}`);
    
    // You could send an email notification to the user here
  }
}
