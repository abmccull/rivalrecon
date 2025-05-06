"use client";

import { useState } from 'react';
import Link from 'next/link';
import { DashboardInsightSnippet } from '@/lib/dashboard';

export default function RecentInsights({ insights = [] }: { insights: DashboardInsightSnippet[] }) {
  // State to track whether the list is expanded
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Initial number of insights to show
  const initialCount = 5;
  
  // Determine which insights to display based on expanded state
  const displayedInsights = isExpanded ? insights : insights.slice(0, initialCount);
  
  // Function to toggle expanded state
  const toggleExpand = () => setIsExpanded(!isExpanded);
  
  const getBorderColor = (type: DashboardInsightSnippet['type']) => {
    switch (type) {
      case 'positive': return 'border-[#2DD4BF]'; 
      case 'negative': return 'border-yellow-500'; 
      case 'opportunity': return 'border-blue-500'; 
      case 'key': return 'border-[#1E3A8A]'; 
      default: return 'border-gray-300'; 
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <h2 className="text-xl font-bold text-[#1F2937] mb-4">Recent Insights</h2>
      
      {/* Insights container with conditional max-height and scrolling */}
      <div className={`space-y-4 ${isExpanded ? 'max-h-[500px] overflow-y-auto pr-2' : ''}`}>
        {displayedInsights.length > 0 ? (
          displayedInsights.map((snippet) => (
            <div 
              key={snippet.id} 
              className={`border-l-4 ${getBorderColor(snippet.type)} pl-4 py-1`}
            >
              <p className="text-gray-700">{snippet.text}</p> 
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500">{snippet.date}</span>
                <span className="mx-2 text-gray-300">•</span>
                <Link href={`/reports/${snippet.analysisId}`} className="text-xs text-[#2DD4BF] hover:underline">
                  {snippet.displayName}
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-400 py-4 text-center">No insights available yet.</div>
        )}
      </div>
      
      {/* Only show toggle button if there are more insights than the initial display count */}
      {insights.length > initialCount && (
        <button 
          onClick={toggleExpand} 
          className="block w-full text-center text-[#2DD4BF] mt-4 hover:underline cursor-pointer transition-colors"
        >
          {isExpanded ? 'Show less' : 'View all insights'}
        </button>
      )}
    </div>
  );
}
