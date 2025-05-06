import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Centralized function for Supabase auth token refreshing and cookie management
export async function middleware(request: NextRequest) {
  // Create a response object that we'll modify and return
  const response = NextResponse.next();

  // Create a Supabase client specifically for the middleware context
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Get cookie value safely - avoid hardcoding specific cookie names
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Set cookie in both request and response for consistency
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string) {
          // Remove cookie from both request and response
          request.cookies.delete(name);
          response.cookies.delete(name);
        },
      },
    }
  );

  // Important: Use getUser() for token refreshing in middleware
  // This refreshes the session by calling Supabase Auth directly
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};