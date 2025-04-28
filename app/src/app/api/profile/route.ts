import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Get the cookie store once
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the session
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session check:', session ? 'Session found' : 'No session');
    
    if (!session) {
      console.log('No session found - returning 401');
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log('Received profile update request for user:', session.user.id);

    // Make sure the ID is the same as the session user
    if (body.id !== session.user.id) {
      console.log('ID mismatch:', body.id, 'vs', session.user.id);
      return NextResponse.json(
        { error: 'Unauthorized - ID mismatch' },
        { status: 403 }
      );
    }

    // Use the server-side Supabase client to update the profile
    console.log('Attempting to update profile with data:', {
      id: body.id,
      first_name: body.first_name,
      last_name: body.last_name,
      // Other fields omitted for log clarity
    });
    
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        ...body,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('Profile updated successfully');
    return NextResponse.json({ 
      success: true,
      data
    });
  } catch (error) {
    console.error('Unexpected error in profile update:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get the cookie store once
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the session
    const { data: { session } } = await supabase.auth.getSession();
    
    return NextResponse.json({
      message: 'Profile API endpoint is working',
      authenticated: !!session,
      userId: session?.user?.id || null
    });
  } catch (error) {
    console.error('Error in GET request:', error);
    return NextResponse.json({
      message: 'Profile API endpoint is working but encountered an error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 