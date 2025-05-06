import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Helper function to create admin client
async function createAdminClient() {
  const cookieStore = cookies();
  const supabase = await createClient();
  return supabase;
}

export async function POST(request: Request) {
  try {
    const { userId, actionType } = await request.json();
    
    if (!userId || !actionType) {
      return NextResponse.json(
        { error: 'User ID and action type are required' },
        { status: 400 }
      );
    }
    
    if (actionType !== 'submission') {
      return NextResponse.json(
        { error: 'Invalid action type' },
        { status: 400 }
      );
    }
    
    // Create database client
    const supabase = await createAdminClient();
    
    // Update the submission_counter in the subscriptions table
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('id, submission_counter')
      .eq('user_id', userId)
      .single();
    
    if (subscriptionError) {
      console.error('Error fetching subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Error fetching subscription' },
        { status: 500 }
      );
    }
    
    if (!subscription) {
      console.error('No subscription found for user:', userId);
      return NextResponse.json(
        { error: 'No subscription found for user' },
        { status: 404 }
      );
    }
    
    // Increment the submission_counter
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        submission_counter: (subscription.submission_counter || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);
    
    if (updateError) {
      console.error('Error updating submission counter:', updateError);
      return NextResponse.json(
        { error: 'Error updating submission counter' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
