"use client";

import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { InfoIcon, CheckCircle2 } from 'lucide-react';
import { useSubscription } from '@/components/layout/SubscriptionProvider';
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface UsageCounterProps {
  used: number;
  limit: number; 
  renewalDate?: string;
  isUnlimited?: boolean;
  className?: string;
}

/**
 * Displays subscription information and usage in a compact card format
 */
export default function UsageCounter({ 
  used, 
  limit, 
  renewalDate, 
  isUnlimited = false, 
  className = '' 
}: UsageCounterProps) {
  // Get additional subscription data from context
  const { subscription } = useSubscription();
  
  // For unlimited plans, show a low fixed percentage
  // For limited plans, calculate actual percentage (capped at 100%)
  const percentUsed = isUnlimited 
    ? 35 // Fixed percentage for unlimited plans for visual indication
    : Math.min(100, (used / limit) * 100);
  
  // Determine usage status color
  let statusColor = "bg-green-500"; // Default: good
  if (!isUnlimited) {
    if (percentUsed > 90) {
      statusColor = "bg-red-500"; // Critical: almost at limit
    } else if (percentUsed > 75) {
      statusColor = "bg-amber-500"; // Warning: getting close to limit
    } else if (percentUsed > 50) {
      statusColor = "bg-blue-500"; // Moderate usage
    }
  }
  
  // Get the appropriate reset date - use trial end date for trial accounts
  const getResetDate = () => {
    // For trial accounts, use the trial end date
    if (subscription?.status === 'trialing' && subscription?.trialEndsAt) {
      return new Date(subscription.trialEndsAt).toLocaleDateString();
    }
    // Otherwise use the provided renewal date or default
    return renewalDate 
      ? new Date(renewalDate).toLocaleDateString()
      : 'Next month';
  };
  
  // Get plan name
  const getPlanName = () => {
    // Map plan IDs to user-friendly names
    const planMapping: Record<string, string> = {
      'starter': 'Starter',
      'growth': 'Growth',
      'scale': 'Scale',
      'pro': 'Pro'
    };
    
    return subscription?.planId 
      ? (planMapping[subscription.planId] || subscription.planId) 
      : 'Starter';
  };
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 shadow-sm ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Your Subscription</h2>
          <p className="text-gray-600 text-sm">Manage your subscription plan</p>
        </div>
        
        {subscription?.status === 'trialing' && (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Trial
          </div>
        )}
      </div>
      
      <div className="flex flex-col space-y-1 mb-6">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-sm font-medium text-gray-500">Plan</h3>
        </div>
        <p className="ml-6 font-medium">{getPlanName()}</p>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold">Monthly Usage</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                {isUnlimited 
                  ? <p>Your plan has unlimited analyses</p>
                  : <p>Your submission count resets on {getResetDate()}</p>
                }
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
          <div 
            className={`h-full ${statusColor}`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span>
            <span className="font-medium">{used}</span> of{" "}
            {isUnlimited ? (
              <span className="font-medium inline-flex items-center">
                <span className="text-xl">∞</span>
                <span className="ml-1">(unlimited)</span>
              </span>
            ) : (
              <span className="font-medium">{limit}</span>
            )}{" "}
            analyses used
          </span>
          <span className="text-muted-foreground text-xs">
            {isUnlimited ? 'No monthly limit' : `Resets: ${getResetDate()}`}
          </span>
        </div>
      </div>
      
      <Link href="/settings?tab=subscription" passHref>
        <Button className="w-full bg-[#2DD4BF] hover:bg-[#0D9488] text-white">
          Manage Subscription
        </Button>
      </Link>
    </div>
  );
}
