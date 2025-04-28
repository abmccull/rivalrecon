"use client";

import { MoreHorizontal } from 'lucide-react';

type KeywordContext = {
  before: string;
  keyword: string;
  after: string;
};

export default function KeywordInContext() {
  // Sample data - in a real app, this would come from props or an API call
  const contexts: KeywordContext[] = [
    {
      before: "Our platform offers the most advanced ",
      keyword: "AI-powered analytics",
      after: " to help businesses make data-driven decisions quickly."
    },
    {
      before: "The latest update includes enhanced ",
      keyword: "machine learning algorithms",
      after: " that can predict customer behavior with higher accuracy."
    },
    {
      before: "We've improved our ",
      keyword: "natural language processing",
      after: " capabilities to better understand customer feedback."
    },
    {
      before: "Organizations using our ",
      keyword: "predictive analytics tools",
      after: " report a 35% increase in conversion rates."
    },
    {
      before: "The integration with ",
      keyword: "data visualization tools",
      after: " allows for more intuitive understanding of complex datasets."
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-[#1F2937]">Keyword in Context</h2>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
      
      <div className="space-y-4">
        {contexts.map((context, index) => (
          <div key={index} className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">
              {context.before}
              <span className="font-medium text-blue-600">{context.keyword}</span>
              {context.after}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
} 