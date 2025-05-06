"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/layout/AuthProvider';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDate } from '@/lib/utils';

/**
 * Component that shows whether a user is eligible for a free trial
 */
export default function TrialEligibilityBadge() {
  const { user } = useAuth();
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    reason?: string;
    trialStart?: string;
    trialEnd?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkEligibility = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/subscription/check-trial-eligibility');
        const data = await response.json();
        
        setEligibility(data);
      } catch (error) {
        console.error('Error checking trial eligibility:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkEligibility();
  }, [user]);
  
  if (loading) {
    return (
      <div className="inline-flex items-center gap-1 text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
        <Clock className="w-3.5 h-3.5" />
        <span>Checking eligibility...</span>
      </div>
    );
  }
  
  if (!eligibility) return null;
  
  if (eligibility.eligible) {
    return (
      <div className="inline-flex items-center gap-1 text-sm bg-green-50 text-green-600 px-2 py-1 rounded">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>Free trial available</span>
      </div>
    );
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1 text-sm bg-amber-50 text-amber-600 px-2 py-1 rounded cursor-help">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Not eligible for trial</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{eligibility.reason}</p>
          {eligibility.trialStart && eligibility.trialEnd && (
            <p className="text-xs mt-1">
              Previous trial: {formatDate(eligibility.trialStart)} - {formatDate(eligibility.trialEnd)}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
