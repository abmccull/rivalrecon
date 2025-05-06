"use client";

import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { InfoIcon } from 'lucide-react';

interface UsageCounterProps {
  used: number;
  limit: number; 
  renewalDate?: string;
  isUnlimited?: boolean;
  className?: string;
}

/**
 * Displays the current usage of submissions against the user's monthly limit
 */
export default function UsageCounter({ 
  used, 
  limit, 
  renewalDate, 
  isUnlimited = false, 
  className = '' 
}: UsageCounterProps) {
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
  
  // Format renewal date for display
  const formattedRenewalDate = renewalDate 
    ? new Date(renewalDate).toLocaleDateString()
    : 'Next month';
  
  return (
    <div className={`rounded-lg border bg-card p-4 shadow-sm ${className}`}>
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
                : <p>Your submission count resets on {formattedRenewalDate}</p>
              }
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="space-y-3">
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
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
            {isUnlimited ? 'No monthly limit' : `Resets: ${formattedRenewalDate}`}
          </span>
        </div>
      </div>
    </div>
  );
}
