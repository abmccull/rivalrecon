import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Verify Stripe is configured
    console.log('Available environment variables:', Object.keys(process.env).filter(key => key.includes('STRIPE')));
    
    // Find the correct Stripe API key regardless of naming convention
    function findStripeKey() {
      // Check for the specific naming convention in your .env file
      if (process.env.Stripe_API_Key) {
        console.log('Found Stripe_API_Key with your naming convention');
        return process.env.Stripe_API_Key;
      }
      
      // Fall back to other common naming conventions
      const key = process.env.STRIPE_SECRET_KEY || 
                process.env.STRIPE_API_KEY || 
                process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;
                
      if (key) console.log('Found Stripe key with alternate naming');
      return key;
    }
    
    const stripeKey = findStripeKey();
    
    if (!stripeKey) {
      console.error('Missing Stripe secret key - checked multiple environment variable names');
      return NextResponse.json(
        { error: 'Stripe is not properly configured' },
        { status: 500 }
      );
    }
    
    // Initialize Stripe directly here to ensure we have a valid instance
    console.log('Using Stripe key:', stripeKey ? '✓ Found' : '✗ Not found');
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2025-04-30.basil' as any, // Use the correct API version
    });
    
    // Get Supabase client
    const supabase = await createClient();
    
    // Make sure cookies are available for authentication
    cookies();
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get customer ID
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();
      
    if (subscriptionError) {
      console.error('Error fetching subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Failed to retrieve subscription information' },
        { status: 500 }
      );
    }
    
    // Handle the case where the user doesn't have a subscription yet
    if (!subscription?.stripe_customer_id) {
      console.log('No subscription found for user', user.id);
      return NextResponse.json(
        { 
          error: 'No active subscription', 
          details: 'You need to subscribe to a plan before accessing the customer portal',
          redirectTo: '/pricing'
        },
        { status: 400 }
      );
    }
    
    // Validate customer ID exists and is properly formatted
    if (!subscription.stripe_customer_id || typeof subscription.stripe_customer_id !== 'string' || !subscription.stripe_customer_id.startsWith('cus_')) {
      console.error('Invalid Stripe customer ID:', subscription.stripe_customer_id);
      return NextResponse.json(
        { error: 'Invalid customer ID format' },
        { status: 400 }
      );
    }
    
    // Debug information
    console.log('Creating portal session for customer:', subscription.stripe_customer_id);
    console.log('User ID:', user.id);
    console.log('Return URL:', `${request.headers.get('origin') || 'http://localhost:3000'}/settings`);
    
    try {
      // Try to retrieve the customer first to validate it exists
      const customer = await stripe.customers.retrieve(subscription.stripe_customer_id);
      console.log('Customer exists in Stripe:', !!customer);
      
      // Create portal session without explicit configuration to use account defaults
      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: `${request.headers.get('origin') || 'http://localhost:3000'}/settings`,
      });
      
      return NextResponse.json({ url: session.url });
    } catch (stripeError: any) {
      console.error('Stripe error:', stripeError);
      
      if (stripeError.code === 'resource_missing') {
        return NextResponse.json(
          { error: 'Customer not found in Stripe' },
          { status: 404 }
        );
      }
      
      throw stripeError; // Re-throw to be caught by the outer catch block
    }
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      stack: error.stack,
      code: error.code
    });
    
    // Provide a more user-friendly error message
    let errorMessage = 'Failed to create customer portal session';
    let statusCode = 500;
    let details = error.message || 'Unknown error';
    
    if (error.type === 'StripeInvalidRequestError') {
      errorMessage = 'Invalid subscription information';
      statusCode = 400;
    } else if (error.code === 'resource_missing') {
      errorMessage = 'Customer not found in Stripe';
      statusCode = 404;
    }
    
    return NextResponse.json(
      { error: errorMessage, details: details },
      { status: statusCode }
    );
  }
}
