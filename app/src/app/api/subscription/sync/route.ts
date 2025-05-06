import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

// Extended Stripe.Subscription type to include the properties we need
type EnhancedSubscription = Stripe.Subscription & {
  current_period_end?: number;
};

// Debug logging function
function logError(message: string, error: any) {
  console.error(`SUBSCRIPTION SYNC ERROR: ${message}`, error);
  // You can add additional logging here if needed
}

// Initialize Stripe with the proper API version
// Note: Using 'as any' to avoid TypeScript errors with the API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,  // Using a stable, documented API version
});

/**
 * Emergency endpoint to manually sync a user's subscription status
 * This helps when webhooks fail to update subscription status
 */
export async function GET(request: NextRequest) {
  // Log that we're starting the sync process
  console.log('Starting subscription sync process');
  
  try {
    // Get Supabase client
    const supabase = await createClient();
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      logError('Authentication error', authError);
      return NextResponse.json({ error: 'Authentication failed', details: authError.message }, { status: 401 });
    }
    
    if (!user) {
      console.log('No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized - No user found' }, { status: 401 });
    }
    
    console.log(`User authenticated: ${user.id}`);
    
    // Look up current user in the subscriptions table
    const { data: subscriptionData, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (subError) {
      console.error('Error fetching subscription data:', subError);
      return NextResponse.json({ error: 'Failed to fetch subscription data' }, { status: 500 });
    }
    
    // If no subscription found in our database, check Stripe directly
    if (!subscriptionData || subscriptionData.length === 0) {
      // Try to find customer by email
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });
      
      if (customers.data.length > 0) {
        const customerId = customers.data[0].id;
        
        // Get subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          limit: 1,
          status: 'active',
          expand: ['data.current_period_end']
        });
        
        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          
          // We found an active subscription in Stripe but not in our database, let's add it
          const enhancedSubscription = subscription as EnhancedSubscription;
          const { error: insertError } = await supabase
            .from('subscriptions')
            .insert({
              user_id: user.id,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              status: subscription.status,
              price_id: (subscription.items.data[0]?.price.id) || null,
              trial_end: subscription.trial_end 
                ? new Date(subscription.trial_end * 1000).toISOString() 
                : null,
              cancel_at_period_end: subscription.cancel_at_period_end,
              current_period_end: enhancedSubscription.current_period_end
                ? new Date(enhancedSubscription.current_period_end * 1000).toISOString() 
                : null,
            });
            
          if (insertError) {
            console.error('Error inserting subscription:', insertError);
            return NextResponse.json({ error: 'Failed to sync subscription' }, { status: 500 });
          }
          
          // Success - redirect to dashboard
          return NextResponse.json({ 
            success: true, 
            message: 'Found and synced your subscription from Stripe',
            subscription: {
              status: subscription.status,
              current_period_end: enhancedSubscription.current_period_end
                ? new Date(enhancedSubscription.current_period_end * 1000).toISOString()
                : null
            }
          });
        }
      }
      
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }
    
    // Get the subscription from Stripe to verify its current status
    try {
      console.log(`Retrieving subscription from Stripe: ${subscriptionData[0].stripe_subscription_id}`);
      
      // Retrieve subscription without expand parameter which might be causing issues
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscriptionData[0].stripe_subscription_id
      );
      
      console.log('Successfully retrieved subscription from Stripe');
      
      // Manually extract the current_period_end from the subscription
      // Note: Using type assertion to handle the Stripe types correctly
      const enhancedSubscription = stripeSubscription as unknown as EnhancedSubscription;
      
      // Log the subscription details for debugging
      console.log('Subscription details:', {
        id: enhancedSubscription.id,
        status: enhancedSubscription.status,
        hasPeriodEnd: Boolean(enhancedSubscription.current_period_end)
      });
      
      // Update our database with the latest status from Stripe
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: stripeSubscription.status,
          trial_end: stripeSubscription.trial_end 
            ? new Date(stripeSubscription.trial_end * 1000).toISOString() 
            : null,
          cancel_at_period_end: stripeSubscription.cancel_at_period_end,
          current_period_end: enhancedSubscription.current_period_end 
            ? new Date(enhancedSubscription.current_period_end * 1000).toISOString() 
            : null,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionData[0].stripe_subscription_id);
        
      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return NextResponse.json({ error: 'Failed to update subscription status' }, { status: 500 });
      }
      
      // Success - redirect to dashboard
      return NextResponse.json({ 
        success: true, 
        message: 'Subscription synced successfully',
        subscription: {
          status: stripeSubscription.status,
          current_period_end: enhancedSubscription.current_period_end
            ? new Date(enhancedSubscription.current_period_end * 1000).toISOString()
            : null
        }
      });
      
    } catch (error: any) {
      console.error('Error retrieving subscription from Stripe:', error);
      
      // If the subscription doesn't exist in Stripe anymore, mark it as canceled
      if (error.code === 'resource_missing') {
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscriptionData[0].stripe_subscription_id);
          
        if (updateError) {
          console.error('Error marking subscription as canceled:', updateError);
        }
        
        return NextResponse.json({ error: 'Subscription not found in Stripe' }, { status: 404 });
      }
      
      return NextResponse.json({ error: 'Failed to retrieve subscription from Stripe' }, { status: 500 });
    }
    
  } catch (error: any) {
    // Comprehensive error logging
    logError('Unexpected error during subscription sync', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      type: error.type,
      params: error.param
    });
    
    // Clear, user-friendly error message
    return NextResponse.json({ 
      error: 'Failed to sync subscription',
      message: error.message || 'An unexpected error occurred', 
      code: error.code,
      action: 'Please try again or contact support if the issue persists.'
    }, { status: 500 });
  }
}
