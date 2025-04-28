import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest, 
  { params }: { params: { submissionId: string } }
) {
  try {
    const submissionId = params.submissionId;
    
    // Create a Supabase client for server-side use
    const supabase = createClient();
    
    // Verify the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - You must be logged in to access this resource' },
        { status: 401 }
      );
    }
    
    // Get the submission to verify ownership
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();
    
    if (submissionError || !submission) {
      console.error('Error fetching submission:', submissionError);
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }
    
    // Verify ownership (current user is the owner of the submission)
    if (submission.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not have permission to access this resource' },
        { status: 403 }
      );
    }
    
    // Get the analysis data
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('*')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (analysisError || !analysis) {
      console.error('Error fetching analysis:', analysisError);
      return NextResponse.json(
        { error: 'Analysis not found for this submission' },
        { status: 404 }
      );
    }
    
    // Get the reviews associated with this submission
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
    }
    
    // Combine the data for the report
    const reportData = {
      submission,
      analysis,
      reviews: reviews || [],
      generatedAt: new Date().toISOString(),
    };
    
    return NextResponse.json(reportData);
    
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating the report' },
      { status: 500 }
    );
  }
} 