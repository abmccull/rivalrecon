"use client";

import { MoreHorizontal } from 'lucide-react';

// Define the topic data structure
type Topic = {
  id: number;
  name: string;
  count: number;
  percentage: number;
  sentiment: 'positive' | 'negative' | 'neutral';
};

export default function TopicsDistribution() {
  // Sample data - in a real app, this would come from props or an API call
  const topics: Topic[] = [
    { id: 1, name: 'User Interface', count: 78, percentage: 30.5, sentiment: 'positive' },
    { id: 2, name: 'Performance', count: 54, percentage: 21.1, sentiment: 'negative' },
    { id: 3, name: 'Features', count: 42, percentage: 16.4, sentiment: 'positive' },
    { id: 4, name: 'Reliability', count: 36, percentage: 14.1, sentiment: 'neutral' },
    { id: 5, name: 'Customer Support', count: 28, percentage: 10.9, sentiment: 'negative' },
    { id: 6, name: 'Pricing', count: 18, percentage: 7.0, sentiment: 'neutral' },
  ];
  
  // Get sentiment color
  const getSentimentColor = (sentiment: Topic['sentiment']) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500';
      case 'negative': return 'bg-red-500';
      case 'neutral': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-[#1F2937]">Topics Distribution</h2>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
      
      <div className="space-y-4">
        {topics.map(topic => (
          <div key={topic.id} className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">{topic.name}</span>
              <span className="text-xs text-gray-500">{topic.count} mentions ({topic.percentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${getSentimentColor(topic.sentiment)}`}
                style={{ width: `${topic.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 