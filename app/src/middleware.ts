import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// In-memory store for rate limiting
// Using a Map to store IP addresses and their request counts
const ipRateLimits = new Map<string, Record<string, { count: number; resetTime: number }>>();

// Configure rate limits for different route types
const rateLimits = {
  // Standard API endpoints
  api: { max: 60, windowMs: 60 * 1000 },  // 60 requests per minute
  
  // Authentication-related endpoints
  auth: { max: 15, windowMs: 60 * 1000 }, // 15 requests per minute
  
  // Stripe payment endpoints (more sensitive)
  stripe: { max: 10, windowMs: 60 * 1000 }, // 10 requests per minute
  
  // Standard page views
  default: { max: 100, windowMs: 60 * 1000 } // 100 requests per minute
};

// Determine which rate limit type applies to a given path
function getRateLimitType(path: string): keyof typeof rateLimits {
  if (path.startsWith('/api/stripe')) return 'stripe';
  if (path.startsWith('/api')) return 'api';
  if (path.includes('/auth') || path.includes('/login') || path.includes('/signup')) return 'auth';
  return 'default';
}

// Clean up old entries to prevent memory leaks
function cleanupOldEntries() {
  const now = Date.now();
  for (const [ip, routes] of ipRateLimits.entries()) {
    let allExpired = true;
    
    for (const type in routes) {
      if (routes[type].resetTime > now) {
        allExpired = false;
        break;
      }
    }
    
    if (allExpired) {
      ipRateLimits.delete(ip);
    }
  }
}

// Centralized function for Supabase auth token refreshing and cookie management
export async function middleware(request: NextRequest) {
  // Run cleanup occasionally to prevent memory leaks (0.1% of requests)
  if (Math.random() < 0.001) {
    cleanupOldEntries();
  }

  // Skip rate limiting for static assets and webhooks
  const path = request.nextUrl.pathname;
  const skipRateLimiting = 
    path.startsWith('/_next') || 
    path.startsWith('/static') || 
    path.includes('favicon.ico') ||
    path.includes('robots.txt') ||
    path.includes('sitemap.xml') ||
    // Skip public health check endpoints
    path === '/api/health' ||
    // Stripe webhooks should use signature verification instead
    path === '/api/stripe/webhook';

  // Create a response object that we'll modify and return
  let response = NextResponse.next();
  
  // Add security headers to all responses
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  };
  
  // Apply security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Handle CORS preflight requests first
  if (request.method === 'OPTIONS') {
    response = new NextResponse(null, { status: 204 });
    
    // Add CORS headers for preflight requests
    const origin = request.headers.get('origin');
    if (origin) {
      // Determine if origin is allowed (only allow our own domain in production)
      const allowedOrigins = process.env.NODE_ENV === 'production'
        ? [process.env.NEXT_PUBLIC_SITE_URL || 'https://rivalrecon.com']
        : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'];
      
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
      }
    }
    
    // Apply security headers to CORS responses
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
  
  // Apply rate limiting for non-excluded paths
  if (!skipRateLimiting) {
    // Get client identifier
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 
              request.headers.get('x-real-ip') ?? 
              '127.0.0.1';
              
    // Get appropriate rate limit for this route
    const rateLimitType = getRateLimitType(path);
    const rateLimit = rateLimits[rateLimitType];
    
    // Get or initialize rate limit tracking for this IP
    if (!ipRateLimits.has(ip)) {
      ipRateLimits.set(ip, {});
    }
    
    const ipData = ipRateLimits.get(ip)!;
    
    // Get or initialize rate limit data for this route type
    if (!ipData[rateLimitType] || ipData[rateLimitType].resetTime <= Date.now()) {
      ipData[rateLimitType] = {
        count: 0,
        resetTime: Date.now() + rateLimit.windowMs
      };
    }
    
    // Increment count
    ipData[rateLimitType].count++;
    
    // Calculate time until reset
    const timeUntilReset = Math.ceil((ipData[rateLimitType].resetTime - Date.now()) / 1000);
    
    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', rateLimit.max.toString());
    response.headers.set('X-RateLimit-Remaining', Math.max(0, rateLimit.max - ipData[rateLimitType].count).toString());
    response.headers.set('X-RateLimit-Reset', timeUntilReset.toString());
    
    // Check if rate limit exceeded
    if (ipData[rateLimitType].count > rateLimit.max) {
      // Return rate limit exceeded response
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Please try again later',
          retryAfter: timeUntilReset
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': timeUntilReset.toString(),
            'X-RateLimit-Limit': rateLimit.max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': timeUntilReset.toString()
          }
        }
      );
    }
  }

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
  matcher: [
    // Match all paths except static files and assets
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};