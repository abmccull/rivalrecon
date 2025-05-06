import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkTrialEligibility } from '@/lib/trial-management';

/**
 * API route to check if a user is eligible for a free trial
 */
export async function GET(request: NextRequest) {
  // Get Supabase client
  const supabase = await createClient();
  
  // Verify user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Check if the user is eligible for a trial
    const eligibility = await checkTrialEligibility(user.id);
    
    return NextResponse.json(eligibility);
  } catch (error: any) {
    console.error('Error checking trial eligibility:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check trial eligibility' }, 
      { status: 500 }
    );
  }
}
