import { NextResponse } from 'next/server';
import { syncUserSubscription, syncAllSubscriptions } from '@/lib/subscription-sync';
import { createClient } from '@supabase/supabase-js';

// Use the service role to bypass RLS policies for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Admin-only API route to manually sync subscription data with Stripe
 */
export async function POST(request: Request) {
  try {
    // Check for admin authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Invalid authorization header' }, { status: 401 });
    }
    
    // Validate the token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Check if user is an admin
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (adminError || !adminData?.is_admin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Parse the request body
    const body = await request.json();
    const { userId } = body;
    
    // If userId is provided, sync just that user's subscription
    if (userId) {
      const result = await syncUserSubscription(userId);
      return NextResponse.json(result);
    }
    
    // Otherwise, sync all subscriptions
    const result = await syncAllSubscriptions();
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('Error in subscription sync API:', error);
    return NextResponse.json(
      { error: `Failed to sync subscriptions: ${error.message}` },
      { status: 500 }
    );
  }
}
