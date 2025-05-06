import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { checkTrialEligibility } from '@/lib/trial-management';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil' as any,
});

/**
 * API route handler to create a Stripe checkout session
 */
export async function POST(request: NextRequest) {
  // Get Supabase client
  const supabase = await createClient();
  
  // Verify user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get request data
    const requestData = await request.json();
    const { priceId, returnUrl = process.env.NEXT_PUBLIC_APP_URL || '' } = requestData;
    
    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }
    
    // Get price details from Stripe
    const price = await stripe.prices.retrieve(priceId);
    
    // Check if the requested product is eligible for a trial
    const productDetails = await stripe.products.retrieve(price.product as string);
    const includesTrial = productDetails.metadata?.trial === 'true';
    
    let trialPeriodDays: number | undefined = undefined;
    
    // If the product includes a trial, check if the user is eligible
    if (includesTrial) {
      const { eligible, reason } = await checkTrialEligibility(user.id);
      
      if (!eligible) {
        // If user is not eligible, we'll create a session without a trial
        console.log(`User ${user.id} is not eligible for a trial: ${reason}`);
      } else {
        // If eligible, set the trial period from the product metadata or use a default
        trialPeriodDays = productDetails.metadata?.trial_days 
          ? parseInt(productDetails.metadata.trial_days) 
          : 14; // Default 14-day trial
      }
    }
    
    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: trialPeriodDays ? { trial_period_days: trialPeriodDays } : undefined,
      success_url: `${returnUrl}/settings?tab=subscription&success=true`,
      cancel_url: `${returnUrl}/pricing?canceled=true`,
      metadata: {
        user_id: user.id,
        has_trial: trialPeriodDays ? 'true' : 'false',
        trial_days: trialPeriodDays?.toString() || '0',
      },
    });
    
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' }, 
      { status: 500 }
    );
  }
}
