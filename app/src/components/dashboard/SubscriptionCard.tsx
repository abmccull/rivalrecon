"use client";

import { useSubscription } from '@/components/layout/SubscriptionProvider';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

interface SubscriptionCardProps {
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * A reusable card component that displays subscription status information
 * Can be used throughout the application for consistent subscription UI
 */
export default function SubscriptionCard({ 
  showActions = true,
  compact = false,
  className = "",
}: SubscriptionCardProps) {
  const { subscription, isLoading, isSubscriptionActive, isInTrial } = useSubscription();
  
  const getStatusBadge = () => {
    if (subscription.status === 'active') {
      return (
        <div className="px-3 py-1 rounded-full bg-green-50 text-green-600 flex items-center gap-1 font-medium text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>Active</span>
        </div>
      );
    } else if (subscription.status === 'trialing') {
      const now = new Date();
      const trialEnd = subscription.trialEndsAt ? new Date(subscription.trialEndsAt) : null;
      const isExpired = trialEnd && trialEnd < now;
      
      if (isExpired) {
        return (
          <div className="px-3 py-1 rounded-full bg-red-50 text-red-600 flex items-center gap-1 font-medium text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Trial Expired</span>
          </div>
        );
      } else {
        return (
          <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 flex items-center gap-1 font-medium text-sm">
            <Clock className="w-4 h-4" />
            <span>Trial</span>
          </div>
        );
      }
    } else {
      return (
        <div className="px-3 py-1 rounded-full bg-gray-50 text-gray-600 flex items-center gap-1 font-medium text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Inactive</span>
        </div>
      );
    }
  };
  
  const getTrialMessage = () => {
    if (!subscription.trialEndsAt || subscription.status !== 'trialing') return null;
    
    const now = new Date();
    const trialEnd = new Date(subscription.trialEndsAt);
    const isExpired = trialEnd < now;
    
    if (isExpired) {
      return (
        <p className="text-red-600 mt-2 text-sm font-medium flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" />
          <span>Your trial period ended on {formatDate(subscription.trialEndsAt)}</span>
        </p>
      );
    } else {
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return (
        <p className="text-blue-600 mt-2 text-sm font-medium">
          <span>Trial ends in {daysLeft} {daysLeft === 1 ? 'day' : 'days'} ({formatDate(subscription.trialEndsAt)})</span>
        </p>
      );
    }
  };
  
  const cardTitle = isInTrial() ? 'Trial Subscription' : 
                    isSubscriptionActive() ? 'Active Subscription' : 'Subscription Needed';
  
  const cardDescription = isInTrial() ? 'You are currently on a free trial period' :
                          isSubscriptionActive() ? 'Your subscription is active and in good standing' :
                          'You need to activate a subscription to access all features';
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-md shadow p-4 flex flex-col gap-2 animate-pulse">
        <h2 className="text-base font-medium">Subscription</h2>
        <div className="flex flex-col gap-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }
  
  if (!subscription.status) {
    return (
      <div className="bg-white rounded-md shadow p-4 flex flex-col gap-2">
        <h2 className="text-base font-medium">Subscription</h2>
        <div>
          <span className="text-gray-500">No active subscription</span>
        </div>
      </div>
    );
  }
  
  if (compact) {
    return (
      <div className={`p-4 bg-white rounded-lg shadow-sm ${className}`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium text-gray-900">{cardTitle}</h3>
            {getStatusBadge()}
          </div>
          {showActions && !isSubscriptionActive() && (
            <Button 
              size="sm" 
              className="bg-[#2DD4BF] hover:bg-[#0D9488] text-white"
              onClick={() => window.location.href = '/settings?tab=subscription'}
            >
              {isInTrial() ? 'Upgrade' : 'Activate'}
            </Button>
          )}
        </div>
        {getTrialMessage()}
      </div>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{cardTitle}</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>{cardDescription}</CardDescription>
        {getTrialMessage()}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className="font-medium capitalize">{subscription.status || 'inactive'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Plan</span>
            <span className="font-medium">{subscription.planId || 'None'}</span>
          </div>
          {subscription.currentPeriodEnd && (
            <div className="flex justify-between">
              <span className="text-gray-500">Next billing date</span>
              <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
            </div>
          )}
        </div>
      </CardContent>
      {showActions && (
        <CardFooter className="flex justify-end gap-2">
          {isSubscriptionActive() ? (
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/settings?tab=subscription'}
            >
              Manage Subscription
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/pricing'}
              >
                View Plans
              </Button>
              <Button 
                className="bg-[#2DD4BF] hover:bg-[#0D9488] text-white"
                onClick={() => window.location.href = '/settings?tab=subscription'}
              >
                {isInTrial() ? 'Upgrade Now' : 'Activate Subscription'}
              </Button>
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}