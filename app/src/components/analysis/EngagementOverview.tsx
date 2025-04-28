"use client";

import { MoreHorizontal, Heart, Share2, MessageSquare, Eye } from 'lucide-react';

type EngagementMetric = {
  name: string;
  value: number;
  icon: React.ReactNode;
  change: number;
};

export default function EngagementOverview() {
  // Sample data - in a real app, this would come from props or an API call
  const metrics: EngagementMetric[] = [
    {
      name: 'Likes',
      value: 45920,
      icon: <Heart className="h-4 w-4 text-red-500" />,
      change: 12.5
    },
    {
      name: 'Shares',
      value: 12075,
      icon: <Share2 className="h-4 w-4 text-blue-500" />,
      change: -3.2
    },
    {
      name: 'Comments',
      value: 8943,
      icon: <MessageSquare className="h-4 w-4 text-purple-500" />,
      change: 8.7
    },
    {
      name: 'Views',
      value: 245632,
      icon: <Eye className="h-4 w-4 text-green-500" />,
      change: 14.2
    }
  ];

  // Format large numbers with K/M suffix
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-[#1F2937]">Engagement Overview</h2>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="flex flex-col">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-2 rounded-full bg-gray-100">
                {metric.icon}
              </div>
              <span className="text-sm text-gray-600">{metric.name}</span>
            </div>
            
            <div className="ml-1">
              <div className="text-xl font-bold">{formatNumber(metric.value)}</div>
              <div className={`text-xs flex items-center ${metric.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                <span>{metric.change >= 0 ? '↑' : '↓'} {Math.abs(metric.change)}%</span>
                <span className="text-gray-500 ml-1">vs. last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 