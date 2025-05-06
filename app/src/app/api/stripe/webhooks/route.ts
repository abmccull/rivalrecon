import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import stripe from '@/lib/stripe-server';
import { logger } from '@/lib/logger';

// Use the service role to bypass RLS policies for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  // Set security headers for the response
  const responseHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
  
  try {
    const body = await request.text();
    // Get Stripe signature from request headers
    const signature = request.headers.get('Stripe-Signature');
    
    // Webhook event received
    
    if (!signature) {
      logger.error('No Stripe signature found in request headers');
      return NextResponse.json(
        { 
          error: 'Invalid request', 
          message: 'No Stripe signature found in request',
          code: 'webhook_signature_missing'
        },
        { 
          status: 400,
          headers: responseHeaders 
        }
      );
    }
    
    let event;
    
    // Check if webhook secret is configured
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      logger.error('STRIPE_WEBHOOK_SECRET is not configured in environment variables');
      return NextResponse.json(
        { 
          error: 'Server configuration error', 
          message: 'Webhook secret not configured',
          code: 'webhook_secret_missing'
        },
        { 
          status: 500,
          headers: responseHeaders 
        }
      );
    }
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      logger.debug(`Successfully verified webhook: ${event.type}`);
      
      // Webhook successfully verified
    } catch (error: any) {
      logger.error(`Webhook signature verification failed: ${error.message}`);
      // Log more details about the error
      logger.error(`Stripe-Signature: ${signature?.substring(0, 20)}...`); // Only log part of signature for security
      logger.error(`Webhook Secret configured: ${process.env.STRIPE_WEBHOOK_SECRET ? 'Yes' : 'No'}`);
      return NextResponse.json(
        { 
          error: 'Invalid request',
          message: `Webhook signature verification failed: ${error.message}`,
          code: 'webhook_signature_invalid'
        },
        { 
          status: 400, 
          headers: responseHeaders 
        }
      );
    }
    
    // Handle different webhook events
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        logger.debug(`Processing subscription event: ${event.type}`); 
        await handleSubscriptionChange(subscription);
        break;
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as any; // Use any temporarily to handle Stripe type inconsistencies
        if (invoice && invoice.subscription) {
          logger.debug(`Processing successful payment for subscription: ${invoice.subscription}`); 
          try {
            const subscription = await stripe.subscriptions.retrieve(String(invoice.subscription));
            await handleSubscriptionChange(subscription);
          } catch (error) {
            logger.error(`Error retrieving subscription for invoice ${invoice.id}:`, error);
          }
        }
        break;
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as any; // Use any temporarily to handle Stripe type inconsistencies
        if (failedInvoice && failedInvoice.subscription) {
          logger.debug(`Processing failed payment for subscription: ${failedInvoice.subscription}`); 
          try {
            const subscription = await stripe.subscriptions.retrieve(String(failedInvoice.subscription));
            await handleSubscriptionChange(subscription);
          } catch (error) {
            logger.error(`Error retrieving subscription for failed invoice ${failedInvoice.id}:`, error);
          }
        }
        break;
      case 'invoice.finalized':
      case 'invoice.paid':
      case 'payment_intent.created':
      case 'payment_intent.succeeded':
        logger.debug(`Acknowledged event type: ${event.type}`);
        // We acknowledge these events but don't need special handling
        // Event acknowledged
        break;
      default:
        logger.debug(`Unhandled event type: ${event.type}`);
        // Unhandled event type
    }
    
    return NextResponse.json(
      { received: true, success: true },
      { headers: responseHeaders }
    );
  } catch (error: any) {
    const errorMsg = error.message;
    logger.error('Error processing webhook event:', errorMsg);
    return NextResponse.json(
      { 
        error: 'Server error', 
        message: 'Webhook processing failed', 
        detail: errorMsg,
        code: 'webhook_processing_error'
      },
      { 
        status: 500,
        headers: responseHeaders 
      }
    );
  }
}

/**
 * Handles subscription created or updated events
 */
async function handleSubscriptionChange(subscription: any) {
  logger.debug('Received Stripe webhook event'); 
  logger.debug('Processing Stripe subscription object with detailed data:');
  logger.debug(JSON.stringify({
    id: subscription.id,
    customer: subscription.customer,
    status: subscription.status,
    current_period_start: subscription.current_period_start,
    current_period_start_date: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
    current_period_end: subscription.current_period_end,
    current_period_end_date: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
    trial_start: subscription.trial_start,
    trial_start_date: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
    trial_end: subscription.trial_end,
    trial_end_date: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    metadata: subscription.metadata,
    items: subscription.items?.data,
  }, null, 2));

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
    // Plan ID retrieved from price metadata
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
      logger.error('No user ID found in subscription metadata');
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
  // Subscription status updated
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
    logger.error('Error canceling subscription:', error);
  } else {
    logger.info(`Subscription ${subscriptionId} successfully canceled for customer ${customerId}`);
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
      logger.error('Error updating subscription after payment success:', error);
    } else {
      logger.info(`Payment success processed for subscription ${subscriptionId}`);
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
    logger.error('Error updating subscription after payment failure:', error);
  } else {
    logger.info(`Payment failure processed for subscription ${subscriptionId}`);
    
    // TODO: Send an email notification to the user here
  }
}
