import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Helper function to create admin client
async function createAdminClient() {
  const cookieStore = cookies();
  const supabase = await createClient();
  return supabase;
}

export async function GET(request: Request) {
  // Get the userId from the query parameter
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }
  
  try {
    // Create database client
    const supabase = await createAdminClient();
    
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    // Get current usage from the submissions_counter in the subscriptions table
    const { data: subscriptionData, error: usageError } = await supabase
      .from('subscriptions')
      .select('submission_counter')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (usageError) {
      console.error('Error checking usage:', usageError);
      return NextResponse.json(
        { error: 'Error checking usage', hasRemainingUsage: false },
        { status: 500 }
      );
    }
    
    const currentUsage = subscriptionData?.submission_counter || 0;
    
    // Get user's subscription and plan
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('plan_id')
      .eq('user_id', userId)
      .single();
    
    if (subscriptionError) {
      console.error('Error checking subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Error checking subscription', hasRemainingUsage: false },
        { status: 500 }
      );
    }
    
    if (!subscription) {
      // No subscription found, default to starter plan
      return NextResponse.json({ hasRemainingUsage: true, planId: 'starter' });
    }
    
    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('monthly_limit, is_unlimited')
      .eq('plan_id', subscription.plan_id)
      .single();
    
    if (planError) {
      console.error('Error checking plan limits:', planError);
      return NextResponse.json(
        { error: 'Error checking plan limits', hasRemainingUsage: false },
        { status: 500 }
      );
    }
    
    // Check if the plan is unlimited
    if (plan.is_unlimited) {
      return NextResponse.json({ hasRemainingUsage: true });
    }
    
    // Check if user has reached their limit
    const submissionsUsed = currentUsage;
    
    // If the plan is unlimited, they have remaining usage
    if (plan.is_unlimited === true) {
      return NextResponse.json({ 
        hasRemainingUsage: true,
        currentUsage: submissionsUsed,
        limit: null,
        isUnlimited: true
      });
    }
    
    // Otherwise check against the monthly limit
    const hasRemainingUsage = submissionsUsed < (plan.monthly_limit || 5);
    
    return NextResponse.json({ 
      hasRemainingUsage,
      currentUsage: submissionsUsed,
      limit: plan.monthly_limit
    });
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', hasRemainingUsage: false },
      { status: 500 }
    );
  }
}
