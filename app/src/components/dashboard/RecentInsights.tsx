"use client";

import Link from 'next/link';
import { DashboardInsight } from '@/lib/dashboard';

export default function RecentInsights({ insights = [] }: { insights: DashboardInsight[] }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <h2 className="text-xl font-bold text-[#1F2937] mb-4">Recent Insights</h2>
      
      <div className="space-y-4">
        {insights.length > 0 ? (
          insights.map((insight) => (
            <div 
              key={insight.id} 
              className={`border-l-4 ${insight.type === 'positive' ? 'border-[#2DD4BF]' : insight.type === 'negative' ? 'border-yellow-500' : 'border-[#1E3A8A]'} pl-4 py-1`}
            >
              <p className="text-gray-600">{insight.text}</p>
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500">{insight.date}</span>
                {insight.submissionTitle && (
                  <>
                    <span className="mx-2 text-gray-300">•</span>
                    {insight.analysisId ? (
                      <Link href={`/analysis/${insight.analysisId}`} className="text-xs text-[#2DD4BF] hover:underline">
                        {insight.submissionTitle}
                      </Link>
                    ) : (
                      <span className="text-xs text-[#2DD4BF]">{insight.submissionTitle}</span>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-400 py-4 text-center">No insights available yet.</div>
        )}
      </div>
      
      <span className="block text-center text-[#2DD4BF] mt-4 hover:underline cursor-pointer">
        View all insights
      </span>
    </div>
  );
}
