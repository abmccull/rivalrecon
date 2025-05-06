/** @type {import('next').NextConfig} */
// Load critical environment variables at build time if needed
const envCheck = () => {
  try {
    // Critical environment variables that must be available during build
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];
    
    // Check if any variables are missing and log warnings
    const missingVars = requiredVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
      console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
      console.warn('Build may proceed but application might not function correctly!');
    }
  } catch (error) {
    console.error('Error checking environment variables:', error);
  }
};

// Run environment check
envCheck();

const nextConfig = {
  // Production-specific optimizations
  reactStrictMode: true,
  productionBrowserSourceMaps: false, // Disable source maps in production for better performance
  
  // Optimized image handling
  images: {
    domains: [
      'yqpyrnnxswvlnuuijmsn.supabase.co', // Supabase storage domain
      'storage.googleapis.com', // Google Storage for avatars
      'lh3.googleusercontent.com' // Google user profile images
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
  },
  
  // Content Security Policy headers 
  // Note: These are applied in addition to those in middleware.ts
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ];
  },
  
  // Redirects for common issues
  redirects: async () => {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true
      },
      {
        source: '/signup',
        destination: '/auth/signup',
        permanent: true
      },
      {
        source: '/login',
        destination: '/sign-in',
        permanent: true
      },
      {
        source: '/signin',
        destination: '/sign-in',
        permanent: true
      },
      {
        // Also handle the redirect from /auth/login to /sign-in to fix existing bookmarks
        source: '/auth/login',
        destination: '/sign-in',
        permanent: true
      }
    ];
  },
  
  // Enable static output optimization
  output: process.env.STATIC_EXPORT === 'true' ? 'export' : undefined,
  
  // Disable serverless function size optimization in favor of better caching
  compress: true,
  
  // Environment detection - helps with different builds per environment
  env: {
    APP_ENV: process.env.NODE_ENV || 'development',
    APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA 
      ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7) 
      : 'local',
  },
  
  // Webpack optimization
  webpack: (config, { dev, isServer }) => {
    // Production optimizations only
    if (!dev) {
      // Add production-only optimizations
      config.optimization.minimize = true;
      
      // Exclude critical dependencies from being bundled
      // Example: large libraries that should be loaded externally
      if (!isServer) {
        config.externals = {
          ...(config.externals || {}),
          // Add any large dependencies here that should be loaded from CDN
          // Example: 'chart.js': 'Chart',
        };
      }
    }
    
    return config;
  },
  
  // ESLint configuration for production builds
  eslint: {
    // Skip ESLint during production builds
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  
  // TypeScript checking configuration
  typescript: {
    // Skip type checking during production builds
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  
  // Experimental features and optimizations
  experimental: {
    optimizePackageImports: ['shadcn-ui', '@radix-ui', 'react-icons'],
  },
  
  // External packages that shouldn't be bundled
  serverExternalPackages: ['sharp'],
  
  // Set a longer build cache TTL in CI/CD environments
  generateBuildId: async () => {
    // Use git commit SHA if available
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
      return process.env.VERCEL_GIT_COMMIT_SHA;
    }
    return `build-${Date.now()}`;
  },
  
  // Performance settings
  poweredByHeader: false, // Remove X-Powered-By header for security
};

module.exports = nextConfig;
