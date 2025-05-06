import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Get recurring analyses for the current user
export async function GET(request: NextRequest) {
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
    
    // Get all recurring analyses for this user
    const { data, error } = await supabase
      .from('recurring_analyses')
      .select(`
        id,
        interval,
        day_of_week,
        last_run,
        next_run,
        status,
        created_at,
        updated_at,
        submission_id,
        submissions (
          id,
          product_title,
          brand_name,
          category_name,
          url,
          is_competitor_product
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      // Handle error fetching recurring analyses silently
      return NextResponse.json(
        { error: 'Failed to fetch recurring analyses' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({ recurringAnalyses: data });
    
  } catch (error: any) {
    console.error('Error in recurring analyses API:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}

// Update a recurring analysis
export async function PUT(request: NextRequest) {
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
    const { id, status, interval, day_of_week } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Recurring analysis ID is required' }, 
        { status: 400 }
      );
    }
    
    // Validate that this recurring analysis belongs to the user
    const { data: existing, error: existingError } = await supabase
      .from('recurring_analyses')
      .select('id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();
    
    if (existingError || !existing) {
      return NextResponse.json(
        { error: 'Recurring analysis not found or access denied' }, 
        { status: 404 }
      );
    }
    
    // Update the recurring analysis
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (status !== undefined) {
      updateData.status = status;
    }
    
    if (interval !== undefined) {
      updateData.interval = interval;
      
      // Recalculate next_run date if interval changes
      const nextRun = calculateNextRunDate(interval);
      updateData.next_run = nextRun.toISOString();
    }
    
    if (day_of_week !== undefined) {
      updateData.day_of_week = day_of_week;
    }
    
    const { data, error } = await supabase
      .from('recurring_analyses')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select();
    
    if (error) {
      // Handle error updating recurring analysis silently
      return NextResponse.json(
        { error: 'Failed to update recurring analysis' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({ recurringAnalysis: data[0] });
    
  } catch (error: any) {
    console.error('Error in recurring analyses API:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}

// Delete a recurring analysis
export async function DELETE(request: NextRequest) {
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
    
    // Parse the ID from the URL
    const id = request.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Recurring analysis ID is required' }, 
        { status: 400 }
      );
    }
    
    // Validate that this recurring analysis belongs to the user
    const { data: existing, error: existingError } = await supabase
      .from('recurring_analyses')
      .select('id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();
    
    if (existingError || !existing) {
      return NextResponse.json(
        { error: 'Recurring analysis not found or access denied' }, 
        { status: 404 }
      );
    }
    
    // Delete the recurring analysis
    const { error } = await supabase
      .from('recurring_analyses')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);
    
    if (error) {
      // Handle error deleting recurring analysis silently
      return NextResponse.json(
        { error: 'Failed to delete recurring analysis' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('Error in recurring analyses API:', error);
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