"use client";

import { ReactNode } from 'react';
import { useSubscription } from '@/components/layout/SubscriptionProvider';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Lock } from 'lucide-react';
import Link from 'next/link';

interface ReportDetailGuardProps {
  children: ReactNode;
  reportId: string;
}

/**
 * A specialized subscription guard for detailed report pages 
 */
export default function ReportDetailGuard({ 
  children, 
  reportId 
}: ReportDetailGuardProps) {
  logger.debug('Report detail guard: subscription status check for specific report item');
  const { subscription, isSubscriptionActive, isLoading } = useSubscription();
  
  // During loading or if the subscription is active, show content (or skeleton)
  // This prevents the flash of "subscription required" during initial load
  if (isLoading || isSubscriptionActive()) {
    // If still loading, show a skeleton UI for the report
    if (isLoading) {
      return (
        <div className="w-full animate-pulse">
          {/* Report title skeleton */}
          <div className="mb-6">
            <div className="h-8 bg-gray-200 rounded-full w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded-full w-1/2"></div>
          </div>
          
          {/* Stats overview skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white rounded-lg shadow-md p-6">
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
          
          {/* Charts skeleton */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded w-full"></div>
          </div>
          
          {/* Insights skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((item) => (
              <div key={item} className="bg-white rounded-lg shadow-md p-6">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // If not loading and subscription is active, show the actual content
    return <>{children}</>;
  }
  
  // Only show this when we're definitely sure the subscription is inactive (not during loading)
  return (
    <div className="w-full max-w-6xl mx-auto p-8 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-amber-50 p-4 mb-6">
          <Lock className="h-12 w-12 text-amber-500" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          {subscription.status === 'trialing' 
            ? 'Your Trial Has Expired' 
            : 'Subscribe to Access Detailed Reports'}
        </h2>
        
        <p className="text-gray-600 mb-2 max-w-xl text-lg">
          {subscription.status === 'trialing' 
            ? "Your free trial period has ended." 
            : "You need an active subscription to access detailed competitor insights."}
        </p>
        
        <p className="text-gray-500 mb-8 max-w-xl">
          {subscription.status === 'trialing' 
            ? "To continue viewing detailed competitor analysis and reports, please upgrade to a paid plan." 
            : "Unlock comprehensive reports with sentiment analysis, competitive insights, and actionable opportunities."}
        </p>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <Button 
            size="lg"
            className="bg-[#2DD4BF] hover:bg-[#0D9488] text-white px-8 py-6 font-medium text-lg"
            onClick={() => window.location.href = '/pricing'}
          >
            View Plans & Pricing
          </Button>
          
          <Button 
            variant="outline"
            size="lg"
            className="border-gray-300 text-gray-700 px-8 py-6 font-medium"
            onClick={() => window.location.href = '/settings?tab=subscription'}
          >
            Manage Subscription
          </Button>
        </div>
        
        <div className="mt-8">
          <Link 
            href="/reports" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to Reports List
          </Link>
        </div>
      </div>
    </div>
  );
}
