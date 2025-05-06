"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/components/layout/AuthProvider';
import { createClient } from '@/lib/supabase/client';

type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' | null;

type SubscriptionContextType = {
  subscription: {
    planId: string | null;
    status: SubscriptionStatus;
    trialEndsAt: Date | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  };
  usageInfo: {
    submissionsUsed: number;
    submissionsLimit: number;
  };
  isLoading: boolean;
  redirectToCustomerPortal: () => Promise<void>;
  isSubscriptionActive: () => boolean;
  isInTrial: () => boolean;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState({
    planId: null as string | null,
    status: null as SubscriptionStatus,
    trialEndsAt: null as Date | null,
    currentPeriodEnd: null as Date | null,
    cancelAtPeriodEnd: false,
  });
  const [usageInfo, setUsageInfo] = useState({
    submissionsUsed: 0,
    submissionsLimit: 0,
  });
  
  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
    } else {
      setIsLoading(false);
      resetSubscriptionData();
    }
  }, [user]);
  
  const fetchSubscriptionData = async () => {
    setIsLoading(true);
    
    try {
      // Make sure user exists before accessing its properties
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }
      
      // Use API endpoints instead of direct database access
      const response = await fetch(`/api/subscription/user?userId=${user.id}`);

      
      if (!response.ok) {
        throw new Error(`Failed to fetch subscription data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.subscription) {
        // Update state with subscription data
        setSubscription({
          planId: data.subscription.plan_id || null,
          status: data.subscription.status || null,
          trialEndsAt: data.subscription.trial_ends_at ? new Date(data.subscription.trial_ends_at) : null,
          currentPeriodEnd: data.subscription.current_period_end ? new Date(data.subscription.current_period_end) : null,
          cancelAtPeriodEnd: data.subscription.cancel_at_period_end || false,
        });
        
        // Log for debugging
        console.log('Current period end:', data.subscription.current_period_end);
        console.log('Formatted period end:', subscription.currentPeriodEnd);
        
        // Update usage info
        const submissionsUsed = typeof data.usage?.submissions_used === 'number' 
          ? data.usage.submissions_used 
          : parseInt(String(data.usage?.submissions_used || '0'), 10) || 0;
        
        const submissionsLimit = typeof data.plan?.monthly_limit === 'number'
          ? data.plan.monthly_limit
          : parseInt(String(data.plan?.monthly_limit || '20'), 10) || 20;
        
        setUsageInfo({
          submissionsUsed,
          submissionsLimit: submissionsLimit === null ? Infinity : submissionsLimit // Handle unlimited plans
        });
        
        // Log usage info for debugging
        console.log('Raw usage data from API:', data.usage);
        console.log('Processed submission values:', { submissionsUsed, submissionsLimit });
      } else {
        resetSubscriptionData();
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      resetSubscriptionData();
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetSubscriptionData = () => {
    setSubscription({
      planId: null,
      status: null,
      trialEndsAt: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
    setUsageInfo({
      submissionsUsed: 0,
      submissionsLimit: 0,
    });
  };
  
  const redirectToCustomerPortal = async () => {
    try {
      // Check if user is authenticated
      if (!user || !user.id) {
        throw new Error('You must be logged in to access the customer portal');
      }
      
      // Add loading state
      setIsLoading(true);
      
      // Use direct Stripe Customer Portal link instead of API call
      console.log('Redirecting to Stripe direct billing portal link');
      window.location.href = 'https://billing.stripe.com/p/login/aEU5okfaO8CXc128ww';
      return;
    } catch (error: any) {
      console.error('Error redirecting to customer portal:', error);
      setIsLoading(false);
      
      // Show a user-friendly error message
      alert(`Failed to access subscription portal: ${error.message || 'Unknown error'}`);
    }
        
  };
  
  const isSubscriptionActive = () => {
    return ['active', 'trialing'].includes(subscription.status as string);
  };
  
  const isInTrial = () => {
    return subscription.status === 'trialing';
  };
  
  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        usageInfo,
        isLoading,
        redirectToCustomerPortal,
        isSubscriptionActive,
        isInTrial,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
