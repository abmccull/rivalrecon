"use client";

import { ReactNode } from 'react';
import { useSubscription } from '@/components/layout/SubscriptionProvider';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface SubscriptionGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A component that checks if user has an active subscription or valid trial
 * and restricts access to protected features if they don't
 */
export function SubscriptionGuard({ children, fallback }: SubscriptionGuardProps) {
  const { subscription, isSubscriptionActive, redirectToCustomerPortal } = useSubscription();
  
  // If subscription is active (includes valid trials), show the children
  if (isSubscriptionActive()) {
    return <>{children}</>;
  }
  
  // Custom fallback content if provided
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Default fallback - subscription expired message
  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-red-50 p-3 mb-4">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {subscription.status === 'trialing' ? 'Your Trial Has Expired' : 'Subscription Required'}
        </h2>
        
        <p className="text-gray-600 mb-6 max-w-md">
          {subscription.status === 'trialing' 
            ? "Your free trial period has ended. Please upgrade to a paid plan to continue using all features."
            : "You need an active subscription to access this feature. Choose a plan that fits your needs."}
        </p>
        
        <div className="flex space-x-4">
          <Button 
            className="bg-[#2DD4BF] hover:bg-[#0D9488] text-white" 
            onClick={() => window.location.href = '/pricing'}
          >
            View Plans
          </Button>
          
          {subscription.status === 'trialing' && (
            <Button 
              variant="outline"
              onClick={redirectToCustomerPortal}
            >
              Manage Subscription
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
