"use client";

import { ReactNode } from 'react';
import { useSubscription } from '@/components/layout/SubscriptionProvider';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Lock } from 'lucide-react';

interface ReportsSubscriptionGuardProps {
  children: ReactNode;
}

/**
 * A specialized subscription guard for reports pages that restricts access
 * to users with active subscriptions or valid trials
 */
export default function ReportsSubscriptionGuard({ children }: ReportsSubscriptionGuardProps) {
  const { subscription, isSubscriptionActive, isLoading } = useSubscription();
  
  logger.debug('Reports guard: isSubscriptionActive:', isSubscriptionActive());
  
  // Show skeleton loader during loading or content if subscription is active
  // This prevents the flash of "subscription required" during initial load
  if (isLoading || isSubscriptionActive()) {
    if (isLoading) {
      // Show a skeleton UI that matches the general shape of the reports table
      return (
        <div className="w-full animate-pulse">
          {/* Table header skeleton */}
          <div className="bg-white p-4 border-b border-gray-200">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          
          {/* Table rows skeleton */}
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="bg-white p-4 border-b border-gray-200">
              <div className="grid grid-cols-4 gap-4">
                <div className="h-4 bg-gray-200 rounded col-span-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
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
            : 'Subscribe to Access Reports'}
        </h2>
        
        <p className="text-gray-600 mb-2 max-w-xl text-lg">
          {subscription.status === 'trialing' 
            ? "Your free trial period has ended." 
            : "You need an active subscription to access competitor reports."}
        </p>
        
        <p className="text-gray-500 mb-8 max-w-xl">
          {subscription.status === 'trialing' 
            ? "To continue viewing detailed competitor analysis and reports, please upgrade to a paid plan." 
            : "Get detailed insights, competitive analysis, and actionable recommendations with a paid subscription."}
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
      </div>
    </div>
  );
}
