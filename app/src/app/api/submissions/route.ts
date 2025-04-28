import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' }, 
        { status: 401 }
      );
    }
    
    // Parse the request body
    const { url, is_competitor_product, recurring, recurring_interval } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' }, 
        { status: 400 }
      );
    }
    
    // Create a submission record in Supabase
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert([
        {
          url,
          user_id: session.user.id,
          status: 'pending',
          is_competitor_product: is_competitor_product || false
          // All other fields will be populated by the scraper
        }
      ])
      .select()
      .single();
    
    if (submissionError) {
      console.error('Supabase error:', submissionError);
      return NextResponse.json(
        { error: 'Failed to create submission' }, 
        { status: 500 }
      );
    }
    
    // If recurring is enabled, create a recurring analysis record
    if (recurring && submission) {
      // Calculate next run date (midnight of next scheduled day)
      const nextRun = calculateNextRunDate(recurring_interval || 'weekly');
      
      const { data: recurringAnalysis, error: recurringError } = await supabase
        .from('recurring_analyses')
        .insert([
          {
            user_id: session.user.id,
            submission_id: submission.id,
            interval: recurring_interval || 'weekly',
            next_run: nextRun.toISOString(),
            status: 'active'
          }
        ])
        .select()
        .single();
        
      if (recurringError) {
        console.error('Error creating recurring analysis:', recurringError);
        // We don't fail the request, just log the error
      } else {
        console.log('Created recurring analysis:', recurringAnalysis);
      }
    }
    
    // Submit to backend API for processing (you would add this in a production environment)
    // For now, we'll just return the submission
    
    return NextResponse.json({ 
      submission,
      recurring_enabled: recurring || false
    });
    
  } catch (error: any) {
    console.error('Error in submissions API:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}

// Helper function to calculate next run date
function calculateNextRunDate(interval: string): Date {
  const now = new Date();
  const nextRun = new Date();
  
  // Set to midnight
  nextRun.setHours(0, 0, 0, 0);
  
  switch (interval) {
    case 'weekly':
      // Set to next week
      nextRun.setDate(nextRun.getDate() + 7);
      break;
    case 'biweekly':
      // Set to two weeks from now
      nextRun.setDate(nextRun.getDate() + 14);
      break;
    case 'monthly':
      // Set to next month
      nextRun.setMonth(nextRun.getMonth() + 1);
      break;
    default:
      // Default to weekly
      nextRun.setDate(nextRun.getDate() + 7);
      break;
  }
  
  return nextRun;
} 