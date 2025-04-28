import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Only process and log the main Supabase auth token (no indexed variants)
          if (name === 'sb-yqpyrnnxswvlnuuijmsn-auth-token') {
            const value = request.cookies.get(name)?.value;
            if (value !== undefined) {
              console.log('Middleware getting cookie:', name, value);
            }
            return value;
          }
          // For all other cookie names, do NOT log anything, just return undefined
          return undefined;
        },
        set(name: string, value: string, options: any) {
          let finalValue = value;
          try {
            // Try decoding if base64
            if (typeof value === 'string' && value.startsWith('base64-')) {
              finalValue = Buffer.from(value.replace('base64-', ''), 'base64').toString('utf-8');
              JSON.parse(finalValue); // Ensure valid JSON
            } else {
              JSON.parse(value);
            }
            request.cookies.set({ name, value: finalValue, ...options });
            response.cookies.set({ name, value: finalValue, ...options });
            console.log('Middleware setting cookie:', name, finalValue);
          } catch (e) {
            console.error('Invalid cookie value for', name, ':', value, e);
          }
        },
        remove(name: string) {
          console.log('Middleware removing cookie:', name);
          request.cookies.delete(name);
          response.cookies.delete(name);
        },
      },
    }
  );

  await supabase.auth.getSession();

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};