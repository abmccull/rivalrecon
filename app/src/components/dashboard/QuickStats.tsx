"use client";

import { DashboardMetrics } from '@/lib/dashboard';

export default function QuickStats({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Changed from Total Insights to Competitors Tracked */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-500">Competitors Tracked</h3>
          {/* Changed icon */}
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600">🎯</span> 
          </div>
        </div>
        <div className="flex items-end">
          {/* Use totalCompetitorsTracked */}
          <span className="text-3xl font-bold text-[#1F2937]">{metrics?.totalCompetitorsTracked || 0}</span>
          {/* Growth percentage removed for now */}
          {/* <span className="ml-2 text-sm text-red-600 flex items-center">
            <span className="mr-1">↓</span>
            {metrics?.insightsGrowth || 0}% <span className="text-gray-500 ml-1">vs last month</span>
          </span> */} 
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-500">Total Submissions</h3>
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
            <span className="text-[#2DD4BF]">👁️</span>
          </div>
        </div>
        <div className="flex items-end">
          <span className="text-3xl font-bold text-[#1F2937]">{metrics?.totalSubmissions || 0}</span>
        </div>
      </div>
      
      {/* Uncomment the "Reviews Analyzed" card and update data source */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-500">Reviews Analyzed</h3>
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-purple-600">💬</span>
          </div>
        </div>
        <div className="flex items-end">
          {/* Use totalReviewsAnalyzed */}
          <span className="text-3xl font-bold text-[#1F2937]">{metrics?.totalReviewsAnalyzed || 0}</span> 
          {/* <span className="ml-2 text-sm text-green-600 flex items-center">
            <span className="mr-1">↑</span>
            {metrics?.reviewsGrowth || 0}% <span className="text-gray-500 ml-1">vs last month</span>
          </span> */}
        </div>
      </div>
    </div>
  );
}
