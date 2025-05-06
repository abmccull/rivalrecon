"use client";

import { useEffect, useState } from 'react';
import styles from './DashboardContent.module.css';
import { useSubscription } from '@/components/layout/SubscriptionProvider';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import SubmissionForm from '@/components/dashboard/SubmissionForm';
import BulkUpload from '@/components/dashboard/BulkUpload';
import AnalysisHistory from '@/components/dashboard/AnalysisHistory';
import QuickStats from '@/components/dashboard/QuickStats';
import RecentInsights from '@/components/dashboard/RecentInsights';
import UsageCounter from '@/components/dashboard/UsageCounter';

interface DashboardContentProps {
  metrics: {
    totalSubmissions: number;
    pendingSubmissions: number;
    completedSubmissions: number;
    totalCompetitorsTracked: number;
    totalReviewsAnalyzed: number;
  };
  submissions: any[];
  insights: any[];
  usageData: {
    used: number;
    limit: number;
    renewalDate: string;
    isUnlimited?: boolean;
  };
}

export default function DashboardContent({ metrics, submissions, insights, usageData }: DashboardContentProps) {
  const { isSubscriptionActive, subscription, isLoading } = useSubscription();
  
  // Show dashboard content during loading and when subscription is active
  // This prevents the flash of "subscription required" during initial load
  if (isLoading || isSubscriptionActive()) {
    return (
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - URL Submission Form */}
        <div className="lg:col-span-1">
          {/* Show skeleton or actual form based on loading state */}
          {isLoading ? (
            <div className="animate-pulse space-y-4 mb-6">
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              <div className="h-64 bg-gray-200 rounded w-full"></div>
              <div className="h-10 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          ) : (
            <>
              <SubmissionForm />
              <BulkUpload />
            </>
          )}
        </div>
        
        {/* Right Column - Analysis History & Quick Stats */}
        <div className="lg:col-span-2">
          {/* Monthly Usage Counter */}
          <div className="mb-6">
            {isLoading ? (
              <div className="animate-pulse h-16 bg-gray-200 rounded w-full"></div>
            ) : (
              <UsageCounter 
                used={usageData.used} 
                limit={usageData.limit} 
                renewalDate={usageData.renewalDate}
                isUnlimited={usageData.isUnlimited} 
              />
            )}
          </div>
          
          <div className="mb-10">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-64 bg-gray-200 rounded w-full"></div>
              </div>
            ) : (
              <AnalysisHistory submissions={submissions} />
            )}
          </div>
          
          <div className="mb-10">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-32 bg-gray-200 rounded w-full"></div>
              </div>
            ) : (
              <QuickStats metrics={metrics} />
            )}
          </div>
          
          <div className="mb-6">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-48 bg-gray-200 rounded w-full"></div>
              </div>
            ) : (
              <RecentInsights insights={insights} />
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Only show this when we're definitely sure the subscription is inactive (not during loading)
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
