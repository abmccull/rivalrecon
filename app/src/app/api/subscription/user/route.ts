import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// Helper function to create admin client
async function createAdminClient() {
  const cookieStore = cookies();
  const supabase = await createClient();
  
  // Admin client creation
  logger.debug('Admin client created for subscription data access');
  
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
    
    // Get user's subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (subscriptionError) {
      console.error('Error fetching subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Error fetching subscription' },
        { status: 500 }
      );
    }
    
    // Log subscription data for debugging
    // Process and normalize subscription data
    
    if (!subscription) {
      // No subscription found
      return NextResponse.json({ 
        subscription: null,
        plan: null,
        usage: null
      });
    }
    
    // Get subscription plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('plan_id', subscription.plan_id)
      .maybeSingle();
    
    if (planError) {
      console.error('Error fetching plan details:', planError);
      // Continue anyway, we have the basic subscription info
    }
    
    // Get current month's usage
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    // Calculate current month's usage metrics
    
    // First check if there's a specific usage_tracking entry
    const { data: usage, error: usageError } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .maybeSingle();
    
    if (usageError && usageError.code !== 'PGRST116') {
      console.error('Error fetching usage:', usageError);
      // Continue anyway, we'll default to subscription data
    }
    
    // If no usage tracking entry exists, check the submissions table count directly
    let submissionsUsed = usage?.submissions_used ?? subscription?.submissions_used ?? 0;
    
    // Double-check by getting actual count from submissions table
    const { count: actualSubmissionCount, error: countError } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
      
    if (!countError && actualSubmissionCount !== null) {
      // Use the database count for accurate usage metrics
      // Use the higher of the two counts to ensure we're showing the correct number
      submissionsUsed = Math.max(Number(submissionsUsed), actualSubmissionCount);
    } else if (countError) {
      console.error('Error getting submission count:', countError);
    }
    
    // Usage calculation finalized
    
    // Process the current_period_end to ensure it's properly formatted
    let formattedSubscription = { ...subscription };
    
    // Make sure current_period_end is properly set if it exists
    if (subscription && subscription.current_period_end) {
      try {
        // Ensure it's a valid date
        const periodEndDate = new Date(subscription.current_period_end);
        if (!isNaN(periodEndDate.getTime())) {
          // If it's a valid date, format it as ISO string
          formattedSubscription.current_period_end = periodEndDate.toISOString();
          console.log('Formatted period end date:', formattedSubscription.current_period_end);
        }
      } catch (err) {
        console.error('Error formatting current_period_end:', err);
        // Keep the original value
      }
    }
    
    // Return all data with proper usage tracking
    return NextResponse.json({
      subscription: formattedSubscription,
      plan,
      usage: {
        submissions_used: submissionsUsed,
        month: currentMonth
      }
    });
  } catch (error) {
    logger.error('Error retrieving subscription data:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
