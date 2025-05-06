import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET handler for retrieving all subscription plans
 * This is a public API that doesn't require authentication
 */
export async function GET() {
  console.log('Subscription plans API called at:', new Date().toISOString());
  
  try {
    // Direct verification of environment variables 
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('CRITICAL ERROR: Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
      return NextResponse.json({ error: 'Missing database configuration' }, { status: 500 });
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('CRITICAL ERROR: Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
      return NextResponse.json({ error: 'Missing database authentication' }, { status: 500 });
    }
    
    // Create Supabase client directly
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch plans from database - use a simpler query without ordering first
    console.log('Attempting to fetch subscription plans...');
    
    // First try a simple query to verify table access
    const tableCheck = await supabase.from('subscription_plans').select('count', { count: 'exact', head: true });
    
    if (tableCheck.error) {
      console.error('Error accessing subscription_plans table:', tableCheck.error);
      console.error('Details:', tableCheck.error.message, tableCheck.error.details);
      return NextResponse.json({ 
        error: 'Database table access error', 
        details: tableCheck.error.message 
      }, { status: 500 });
    }
    
    // Table exists, now fetch the actual data
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('monthly_price', { ascending: true });

    if (error) {
      console.error('Error fetching subscription plans:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch subscription plans', 
        details: error.message || 'Unknown database error'
      }, { status: 500 });
    }

    // If no data, return an empty array instead of null
    if (!data || data.length === 0) {
      console.warn('No subscription plans found in database');
      return NextResponse.json([], { status: 404 });
    }

    // Log success and return the plans from database
    console.log(`Successfully fetched ${data.length} subscription plans`);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Unexpected error fetching subscription plans:', err);
    return NextResponse.json({ 
      error: 'An unexpected error occurred', 
      details: err.message || 'Unknown error'
    }, { status: 500 });
  }
}
