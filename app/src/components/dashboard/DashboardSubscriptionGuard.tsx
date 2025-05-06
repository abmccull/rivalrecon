"use client";

import { ReactNode } from 'react';
import { useSubscription } from '@/components/layout/SubscriptionProvider';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DashboardSubscriptionGuardProps {
  children: ReactNode;
}

/**
 * A specialized subscription guard for the dashboard that redirects expired users
 * to manage their subscription
 */
export default function DashboardSubscriptionGuard({ children }: DashboardSubscriptionGuardProps) {
  const { subscription, isSubscriptionActive } = useSubscription();
  
  // If subscription is active (includes valid trials), show the children
  if (isSubscriptionActive()) {
    return <>{children}</>;
  }
  
  // For expired trials or inactive subscriptions, show upgrade prompt
  return (
    <div className="w-full p-8 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-amber-50 p-3 mb-4">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {subscription.status === 'trialing' ? 'Your Trial Has Expired' : 'Subscription Required'}
        </h2>
        
        <p className="text-gray-600 mb-8 max-w-lg">
          {subscription.status === 'trialing' 
            ? "Your free trial period has ended. To continue using RivalRecon's competitor analysis tools, please upgrade to a paid plan."
            : "You need an active subscription to access RivalRecon's competitor analysis tools. Choose a plan that fits your needs."}
        </p>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <Button 
            className="bg-[#2DD4BF] hover:bg-[#0D9488] text-white px-6 py-2 font-medium"
            onClick={() => window.location.href = '/pricing'}
          >
            View Plans & Pricing
          </Button>
          
          <Button 
            variant="outline"
            className="border-gray-300 text-gray-700 px-6 py-2 font-medium"
            onClick={() => window.location.href = '/settings?tab=subscription'}
          >
            Manage Subscription
          </Button>
        </div>
      </div>
    </div>
  );
}
