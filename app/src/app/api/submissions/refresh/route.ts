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
    const { submissionId } = await request.json();
    
    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' }, 
        { status: 400 }
      );
    }
    
    // Verify that the submission belongs to the user and exists
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('id, status, url, is_competitor_product')
      .eq('id', submissionId)
      .eq('user_id', session.user.id)
      .single();
    
    if (submissionError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found or access denied' }, 
        { status: 404 }
      );
    }
    
    // Create a new "refresh" submission linked to the original
    const { data: refreshSubmission, error: refreshError } = await supabase
      .from('submissions')
      .insert([
        {
          url: submission.url,
          user_id: session.user.id,
          status: 'pending',
          is_competitor_product: submission.is_competitor_product,
          refresh_parent_id: submissionId
        }
      ])
      .select()
      .single();
    
    if (refreshError) {
      console.error('Supabase error:', refreshError);
      return NextResponse.json(
        { error: 'Failed to create refresh submission' }, 
        { status: 500 }
      );
    }
    
    // Update the original submission status to "refreshing"
    const { error: updateError } = await supabase
      .from('submissions')
      .update({ status: 'refreshing' })
      .eq('id', submissionId);
    
    if (updateError) {
      console.error('Error updating submission status:', updateError);
      // Don't fail the request, just log the error
    }
    
    // In production, you would trigger the backend processing job here
    // For example, using a webhook or directly calling the backend API
    
    // Return success
    return NextResponse.json({ 
      success: true, 
      message: 'Refresh initiated successfully',
      refreshSubmission
    });
    
  } catch (error: any) {
    console.error('Error in refresh API:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
} 