import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Get the cookie store
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Should ideally use SERVICE_ROLE_KEY server-side if needed
      {
        cookies: {
          async get(name: string) {
            return (await cookieStore).get(name)?.value;
          },
          async set(name: string, value: string, options: CookieOptions) {
            (await cookieStore).set({ name, value, ...options });
          },
          async remove(name: string, options: CookieOptions) {
            (await cookieStore).set({ name, value: '', ...options });
          },
        },
      }
    );

    // Get the authenticated user server-side
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();

    if (sessionError || !user) {
      // Session error occurred
      return NextResponse.json(
        { error: 'Unauthorized - Invalid session' },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Make sure the ID in the body matches the authenticated user's ID
    if (body.id !== user.id) {
      // ID mismatch detected
      return NextResponse.json(
        { error: 'Unauthorized - ID mismatch' },
        { status: 403 }
      );
    }

    // Map the fields from the request body to the profile table schema
    // Define the type for our profile data to handle TypeScript type checking
    interface ProfileData {
      [key: string]: any;
      id: string;
      email?: string;
      first_name?: string;
      last_name?: string;
      display_name?: string;
      phone?: string;
      avatar_url?: string;
      company_name?: string;
      industry?: string;
      job_title?: string;
      company?: string;
      bio?: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      language?: string;
      timezone?: string;
      show_email?: boolean;
      show_phone?: boolean;
      notification_weekly_reports?: boolean;
      notification_competitor_alerts?: boolean;
      notification_product_updates?: boolean;
      notification_marketing_emails?: boolean;
      updated_at: string;
    }
    
    // Create an object that handles both camelCase (frontend) and snake_case (database) field names
    const profileDataToSave: ProfileData = {
      id: user.id, // Use the authenticated user's ID
      email: body.email,
      first_name: body.firstName || body.first_name,
      last_name: body.lastName || body.last_name,
      display_name: body.displayName || body.display_name || `${body.firstName || ''} ${body.lastName || ''}`.trim(),
      phone: body.phone,
      avatar_url: body.avatarUrl || body.avatar_url, // Handle avatar URL from Supabase Storage
      company_name: body.companyName || body.company_name,
      industry: body.industry,
      job_title: body.jobTitle || body.job_title,
      company: body.company,
      bio: body.bio,
      address: body.address,
      city: body.city,
      state: body.state,
      zip: body.zip,
      language: body.language,
      timezone: body.timezone,
      show_email: body.showEmail || body.show_email,
      show_phone: body.showPhone || body.show_phone,
      notification_weekly_reports: body.notification_weekly_reports || body.notificationWeeklyReports,
      notification_competitor_alerts: body.notification_competitor_alerts || body.notificationCompetitorAlerts, 
      notification_product_updates: body.notification_product_updates || body.notificationProductUpdates,
      notification_marketing_emails: body.notification_marketing_emails || body.notificationMarketingEmails,
      updated_at: new Date().toISOString(),
    };
    

    
    // Remove undefined values (to avoid overwriting existing data with null)
    Object.keys(profileDataToSave).forEach(key => {
      if (profileDataToSave[key] === undefined) {
        delete profileDataToSave[key];
      }
    });



    // Upsert the validated profile data
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileDataToSave) // Use the filtered object
      .select(); // Optionally select the result to confirm

    if (error) {
      // Handle profile update error
      // Provide more context in the error response if not production
      const errorMessage = process.env.NODE_ENV === 'production' ? 'Failed to update profile.' : error.message;
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }


    return NextResponse.json({
      success: true,
      data // Return the upserted data
    });
  } catch (error) {
    // Catch-all error handling
    return NextResponse.json(
      { error: 'An unexpected error occurred while updating the profile.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get the cookie store once and properly await it
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            return (await cookieStore).get(name)?.value;
          },
          async set(name: string, value: string, options: CookieOptions) {
            (await cookieStore).set({ name, value, ...options });
          },
          async remove(name: string, options: CookieOptions) {
            (await cookieStore).set({ name, value: '', ...options });
          },
        },
      }
    );
    
    // Get authenticated user data (more secure than using session directly)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    return NextResponse.json({
      message: 'Profile API endpoint is working',
      authenticated: !!user,
      userId: user?.id || null,
      error: userError ? userError.message : null
    });
  } catch (error) {
    // Log critical errors in production
    console.error('Profile GET error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({
      message: 'Profile API endpoint is working but encountered an error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
