import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe-server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Get Supabase client (it's an async function in your implementation)
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const { planId, billingCycle } = await request.json();
    
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }
    
    // Get plan details from database
    const { data: planData, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('plan_id', planId)
      .single();
      
    if (planError || !planData) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    // Get or create customer
    const { data: subscriptionData, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();
    
    let customerId = subscriptionData?.stripe_customer_id;
    
    if (!customerId) {
      // Try to get user profile info for better customer data
      const { data: userData } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();
      
      const customer = await stripe.customers.create({
        email: userData?.email || user.email,
        name: user.user_metadata?.full_name,
        metadata: {
          userId: user.id,
        },
      });
      
      customerId = customer.id;
    }
    
    // Create a product in Stripe if it doesn't exist
    const productName = `${planData.name} Plan`;
    const productDescription = planData.description;
    
    // Check if product exists
    const { data: existingProducts } = await stripe.products.list({
      active: true,
    });
    
    let product = existingProducts.find(p => p.name === productName);
    
    if (!product) {
      product = await stripe.products.create({
        name: productName,
        description: productDescription,
        metadata: {
          plan_id: planId
        }
      });
    }
    
    // Check if price exists
    const { data: existingPrices } = await stripe.prices.list({
      product: product.id,
      active: true,
    });
    
    let price;
    const billingInterval = request.headers.get('x-billing-interval') === 'yearly' ? 'year' : 'month';
    const amount = billingInterval === 'year' ? planData.yearly_price * 100 : planData.monthly_price * 100;
    
    price = existingPrices.find(p => {
      return p.unit_amount === Math.round(amount) && 
             p.recurring?.interval === billingInterval;
    });
    
    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(amount),
        currency: 'usd',
        recurring: {
          interval: billingInterval as 'month' | 'year',
        },
        metadata: {
          plan_id: planId
        }
      });
    }
    
    // Create checkout session with proper origin URL
    // Get origin with fallback to ensure we have a valid URL
    const origin = request.headers.get('origin') || 
                  request.headers.get('referer')?.replace(/\/[^/]*$/, '') || 
                  process.env.NEXT_PUBLIC_APP_URL || 
                  'http://localhost:3000';
                  
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/dashboard?checkout_success=true`,
      cancel_url: `${origin}/pricing?checkout_canceled=true`,
      subscription_data: {
        trial_period_days: 3,
        metadata: {
          userId: user.id,
          planId: planId,
        },
      },
      metadata: {
        userId: user.id,
        planId: planId,
      },
    });
    
    // If this is a new subscription, create a record in the database
    if (!subscriptionData) {
      await supabase
        .from('subscriptions')
        .upsert({
          id: crypto.randomUUID(),
          user_id: user.id,
          stripe_customer_id: customerId,
          plan_id: planId,
          status: 'trialing',
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          submission_counter: 0
        });
    }
    
    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
