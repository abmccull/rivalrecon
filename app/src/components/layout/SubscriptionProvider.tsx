"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/components/layout/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

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
  const [initialLoad, setInitialLoad] = useState(true);
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
  
  // Initialize subscription data as early as possible
  useEffect(() => {
    // Set loading state immediately on first mount
    setIsLoading(true);
    
    if (user) {
      // Fetch immediately when provider mounts and user exists
      fetchSubscriptionData();
    } else {
      logger.debug('No authenticated user, clearing subscription state');
      // Only clear loading state if user is definitely not authenticated
      setIsLoading(false);
      setInitialLoad(false);
    }
  }, [user]);
  
  const fetchSubscriptionData = async () => {
    // Track fetch start time for minimum loading time enforcement
    const startTime = performance.now();
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
        // Helper function to safely parse dates
        const parseDate = (dateString: string | null) => {
          if (!dateString) return null;
          
          try {
            const date = new Date(dateString);
            // Check if date is valid
            if (isNaN(date.getTime())) {
              logger.error('Invalid date string:', dateString);
              return null;
            }
            return date;
          } catch (err) {
            logger.error('Error parsing date:', err);
            return null;
          }
        };
        
        // Update state with subscription data
        setSubscription({
          planId: data.subscription.plan_id || null,
          status: data.subscription.status || null,
          trialEndsAt: parseDate(data.subscription.trial_end),
          currentPeriodEnd: parseDate(data.subscription.current_period_end),
          cancelAtPeriodEnd: data.subscription.cancel_at_period_end || false,
        });
        
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
      } else {
        resetSubscriptionData();
      }
    } catch (error) {
      logger.error('Error fetching subscription data:', error);
      resetSubscriptionData();
    } finally {
      // Enforce a minimum loading time to prevent flickering
      const elapsedTime = performance.now() - startTime;
      const minLoadingTime = 300; // 300ms minimum loading time to prevent flash
      
      if (elapsedTime < minLoadingTime) {
        setTimeout(() => {
          setIsLoading(false);
          setInitialLoad(false);
        }, minLoadingTime - elapsedTime);
      } else {
        setIsLoading(false);
        setInitialLoad(false);
      }
    }
  };
  
  const resetSubscriptionData = () => {
    // Don't flash empty state during initial load
    if (!initialLoad) {
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
    }
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
    // First, check if the status is active
    if (subscription.status === 'active') {
      return true;
    }
    
    // For trial accounts, check if the trial period is still valid
    if (subscription.status === 'trialing' && subscription.trialEndsAt) {
      const now = new Date();
      const trialEndsAt = new Date(subscription.trialEndsAt);
      
      // Trial is only active if end date is in the future
      const isTrialValid = trialEndsAt > now;
      
      return isTrialValid;
    }
    
    // For all other statuses (past_due, canceled, etc.), access is denied
    return false;
  };
  
  const isInTrial = () => {
    // Check both status and that the trial hasn't expired
    if (subscription.status === 'trialing' && subscription.trialEndsAt) {
      const now = new Date();
      return subscription.trialEndsAt > now;
    }
    return false;
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
