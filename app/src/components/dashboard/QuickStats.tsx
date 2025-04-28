"use client";

import { DashboardMetrics } from '@/lib/dashboard';

export default function QuickStats({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-500">Total Analyses</h3>
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-[#1E3A8A]">📊</span>
          </div>
        </div>
        <div className="flex items-end">
          <span className="text-3xl font-bold text-[#1F2937]">{metrics?.totalAnalyses || 0}</span>
          <span className="ml-2 text-sm text-green-600 flex items-center">
            <span className="mr-1">↑</span>
            {metrics?.analysesGrowth || 0}% <span className="text-gray-500 ml-1">vs last month</span>
          </span>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-500">Competitors Tracked</h3>
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
            <span className="text-[#2DD4BF]">👁️</span>
          </div>
        </div>
        <div className="flex items-end">
          <span className="text-3xl font-bold text-[#1F2937]">{metrics?.competitorsTracked || metrics?.totalCompetitors || 0}</span>
          <span className="ml-2 text-sm text-green-600 flex items-center">
            <span className="mr-1">↑</span>
            {metrics?.competitorsGrowth || 0}% <span className="text-gray-500 ml-1">vs last month</span>
          </span>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-500">Reviews Analyzed</h3>
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-purple-600">💬</span>
          </div>
        </div>
        <div className="flex items-end">
          <span className="text-3xl font-bold text-[#1F2937]">{metrics?.reviewsAnalyzed || metrics?.totalReviews || 0}</span>
          <span className="ml-2 text-sm text-green-600 flex items-center">
            <span className="mr-1">↑</span>
            {metrics?.reviewsGrowth || 0}% <span className="text-gray-500 ml-1">vs last month</span>
          </span>
        </div>
      </div>
    </div>
  );
}
