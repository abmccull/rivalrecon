"use client";

import { Analysis } from '@/lib/analysis';

interface BreadcrumbActionsProps {
  analysis: Analysis;
}

export default function BreadcrumbActions({ analysis }: BreadcrumbActionsProps) {
  return (
    <div id="breadcrumb-actions" className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div className="mb-4 md:mb-0">
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <span className="hover:text-[#2DD4BF] cursor-pointer">Dashboard</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="hover:text-[#2DD4BF] cursor-pointer">Submissions</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[#1E3A8A] font-medium">{analysis?.display_name || "Analysis Results"}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#1F2937]">Analysis Results</h1>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#1E3A8A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Export</span>
        </button>
        <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#1E3A8A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>Share</span>
        </button>
        <button className="flex items-center bg-[#2DD4BF] text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Analysis</span>
        </button>
      </div>
    </div>
  );
}
