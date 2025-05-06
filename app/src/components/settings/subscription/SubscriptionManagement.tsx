"use client";

import { useState, useEffect } from 'react';
import { useSubscription } from '@/components/layout/SubscriptionProvider';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, AlertTriangle, InfoIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Define a skeleton component as this might be missing from the UI library
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className || ''}`}></div>
);

// Helper function to check if a date is valid
function isValidDate(date: Date | null): boolean {
  if (!date) return false;
  return !isNaN(date.getTime());
}

export function SubscriptionManagement() {
  const { subscription, usageInfo, isLoading, redirectToCustomerPortal, isSubscriptionActive } = useSubscription();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [planName, setPlanName] = useState<string>('');
  const { toast } = useToast();
  
  // Map plan IDs to readable names if API fails
  const planMapping: Record<string, string> = {
    'starter': 'Starter',
    'growth': 'Growth',
    'scale': 'Scale'
  };
  
  // State tracking for subscription changes
  useEffect(() => {
    // Debug logs removed for production
  }, [subscription, usageInfo, isLoading, planName, isSubscriptionActive]);
  
  // Fetch plan name when subscription data changes
  useEffect(() => {
    // Use the fallback mapping immediately while fetching from API
    if (subscription.planId) {
      setPlanName(planMapping[subscription.planId] || subscription.planId);
    }
    
    const fetchPlanName = async () => {
      if (!subscription.planId) return;
      
      try {
        // Use the API endpoint instead of direct database access
        const response = await fetch('/api/subscription/plans', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          console.error(`API error: ${response.status} ${response.statusText}`);
          // We already set the fallback name above, so just return
          return;
        }
        
        const plans = await response.json();
        const currentPlan = plans.find((p: { plan_id: string; name: string }) => 
          p.plan_id === subscription.planId
        );
        
        if (currentPlan) {
          setPlanName(currentPlan.name);
        }
        // If plan not found, we already set the fallback name above
      } catch (error) {
        console.error('Error fetching plan name:', error);
        // We already set the fallback name above, so no action needed
      }
    };
    
    fetchPlanName();
  }, [subscription.planId]);

  const handleManageSubscription = async () => {
    try {
      setIsRedirecting(true);
      await redirectToCustomerPortal();
    } catch (error) {
      console.error('Error redirecting to customer portal:', error);
      toast({
        title: 'Error',
        description: 'Failed to redirect to subscription management portal',
        variant: 'destructive',
      });
      setIsRedirecting(false);
    }
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (err) {
      return 'N/A';
    }
  };

  const getStatusIndicator = () => {
    if (!subscription) return null;

    switch (subscription.status) {
      case 'active':
        return (
          <div className="px-3 py-1 rounded-full bg-green-50 text-green-600 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Active</span>
          </div>
        );
      case 'trialing':
        return (
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Trial</span>
            </div>
            {subscription.trialEndsAt && (
              <div className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 flex items-center gap-1 text-xs font-medium">
                <span>Trial ends {formatDate(subscription.trialEndsAt ? subscription.trialEndsAt.toISOString() : null)}</span>
              </div>
            )}
          </div>
        );
      case 'past_due':
        return (
          <div className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 flex items-center gap-1 font-medium">
            <AlertTriangle className="w-4 h-4" />
            <span>Past Due</span>
          </div>
        );
      case 'canceled':
        return (
          <div className="px-3 py-1 rounded-full bg-red-50 text-red-600 flex items-center gap-1 font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>Canceled</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-5 sm:p-6 bg-white shadow rounded-lg animate-pulse">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-7 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div>
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-7 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (!subscription || !subscription.planId) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-[#1F2937]">Subscription Management</h2>
        </div>
        <div className="p-6">
          <div className="mb-6 text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Subscription</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Subscribe to a plan to unlock all RivalRecon features and get enhanced competitor insights and analytics.
            </p>
            <Button
              onClick={() => window.location.href = '/pricing'}
              className="bg-[#2DD4BF] hover:bg-[#0D9488] text-white font-medium py-2 px-6 rounded-md"
            >
              View Plans
            </Button>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-medium text-gray-900 mb-3">Free Tier Features</h4>
            <ul className="space-y-2">
              <li className="flex items-center text-sm text-gray-600">
                <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Limited competitor analysis
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                5 submissions per month
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Basic reporting features
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Calculate usage percentage
  const usageLimit = usageInfo.submissionsLimit || 0;
  const usagePercent = usageLimit > 0 
    ? Math.min(100, (usageInfo.submissionsUsed || 0) / usageLimit * 100) 
    : 0;
  
  // Check if the plan is unlimited based on the is_unlimited field in the schema
  const isUnlimited = usageLimit === 0 || usageLimit === null;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Your Subscription</CardTitle>
              <CardDescription>Manage your subscription plan</CardDescription>
            </div>
            {/* Status indicator in the top right */}
            {subscription.status === 'trialing' ? (
              <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Trial</span>
              </div>
            ) : (
              getStatusIndicator()
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Plan</h4>
              <p className="font-medium">{planName || subscription.planId}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Status</h4>
              <p className="font-medium capitalize">{subscription.status}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                {subscription.status === 'trialing' ? 'Trial Period Ends' : 'Current Period Ends'}
              </h3>
              <p className={`mt-1 text-lg font-semibold ${subscription.status === 'trialing' && subscription.trialEndsAt && new Date(subscription.trialEndsAt) < new Date() ? 'text-red-600' : ''}`}>
                {subscription.status === 'trialing'
                  ? (() => {
                      // Use direct date handling for trialing status
                      if (!subscription.trialEndsAt) {
                        return 'N/A';
                      }
                      
                      try {
                        const trialEndDate = new Date(subscription.trialEndsAt);
                        const now = new Date();
                        
                        // Check if date is valid
                        if (isNaN(trialEndDate.getTime())) {
                          return 'N/A';
                        }
                        
                        const isExpired = trialEndDate < now;
                        
                        return isExpired 
                          ? `Expired on ${formatDate(trialEndDate)}` 
                          : formatDate(trialEndDate);
                      } catch (err) {
                        return 'N/A';
                      }
                    })()
                  : subscription.currentPeriodEnd && isValidDate(subscription.currentPeriodEnd)
                    ? formatDate(subscription.currentPeriodEnd)
                    : 'N/A'}
              </p>
              
              {/* Show expired trial warning */}
              {subscription.status === 'trialing' && subscription.trialEndsAt && new Date(subscription.trialEndsAt) < new Date() && (
                <div className="mt-1 text-sm px-2 py-1 bg-red-50 border border-red-200 rounded text-red-700">
                  Your trial has expired. Please upgrade to continue using all features.
                </div>
              )}
            </div>
            {/* We've moved the trial end date to the Current Period Ends section above */}
          </div>

          {/* Monthly Usage Counter - Styled like the dashboard component */}
          <div className="col-span-2 mt-6 rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Monthly Usage</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    {isUnlimited 
                      ? <p>Your plan has unlimited analyses</p>
                      : <p>Your submission count resets at the end of your billing period</p>
                    }
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="space-y-3">
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${usagePercent > 90 ? 'bg-red-500' : usagePercent > 75 ? 'bg-amber-500' : usagePercent > 50 ? 'bg-blue-500' : 'bg-green-500'}`}
                  style={{ width: `${isUnlimited ? 35 : usagePercent}%` }}
                />
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span>
                  <span className="font-medium">{usageInfo.submissionsUsed}</span> of{" "}
                  {isUnlimited ? (
                    <span className="font-medium inline-flex items-center">
                      <span className="text-xl">∞</span>
                      <span className="ml-1">(unlimited)</span>
                    </span>
                  ) : (
                    <span className="font-medium">{usageInfo.submissionsLimit}</span>
                  )}{" "}
                  analyses used
                </span>
                <span className="text-muted-foreground text-xs">
                  {isUnlimited ? 'No monthly limit' : (
                    subscription.status === 'trialing' && subscription.trialEndsAt
                      ? `Resets: ${new Date(subscription.trialEndsAt).toLocaleDateString()}`
                      : `Resets: ${subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'Next billing cycle'}`
                  )}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleManageSubscription}
            disabled={isRedirecting}
            className="bg-[#2DD4BF] hover:bg-[#0D9488]"
          >
            {isRedirecting ? 'Redirecting...' : 'Manage Subscription'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
