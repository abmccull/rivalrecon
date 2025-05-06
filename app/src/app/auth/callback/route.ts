import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next');

  if (code) {
    const cookieStore = cookies();
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
    
    // Exchange code for session
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    const session = data?.session;
    
    if (!error && session) {
      console.log("Auth successful, checking subscription status");
      
      try {
        // Get the user subscription status
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
          
        // If no subscription exists, redirect to pricing page
        if (!subscription) {
          console.log("No subscription found, redirecting to pricing page");
          return NextResponse.redirect(`${origin}/pricing`);
        }
        
        // If a valid subscription exists or next parameter is specified, use that
        const redirectPath = next || '/dashboard';
        return NextResponse.redirect(`${origin}${redirectPath}`);
      } catch (subscriptionError) {
        console.error('Error checking subscription:', subscriptionError);
        // Default to pricing page if there's any issue checking subscription
        return NextResponse.redirect(`${origin}/pricing`);
      }
    }
    console.error('Auth Callback Error - Code Exchange Failed:', error?.message || 'Unknown error');
    // Optionally redirect to an error page
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`); 
  }

  // return the user to an error page with instructions
  console.error('Auth Callback Error - No Code Found');
  return NextResponse.redirect(`${origin}/login?error=no_auth_code`);
}
