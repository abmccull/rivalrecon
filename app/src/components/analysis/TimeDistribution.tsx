"use client";

import { MoreHorizontal } from 'lucide-react';

type TimeDataPoint = {
  date: string;
  value: number;
  sentiment: 'positive' | 'negative' | 'neutral';
};

type TopicTimeData = {
  topic: string;
  data: TimeDataPoint[];
};

export default function TimeDistribution() {
  // Sample data - in a real app, this would come from props or an API call
  const timeData: TopicTimeData[] = [
    {
      topic: 'Performance',
      data: [
        { date: 'Jan', value: 30, sentiment: 'positive' },
        { date: 'Feb', value: 40, sentiment: 'positive' },
        { date: 'Mar', value: 35, sentiment: 'positive' },
        { date: 'Apr', value: 50, sentiment: 'positive' },
        { date: 'May', value: 65, sentiment: 'positive' },
        { date: 'Jun', value: 60, sentiment: 'positive' },
      ]
    },
    {
      topic: 'UI/UX',
      data: [
        { date: 'Jan', value: 45, sentiment: 'neutral' },
        { date: 'Feb', value: 50, sentiment: 'positive' },
        { date: 'Mar', value: 55, sentiment: 'positive' },
        { date: 'Apr', value: 45, sentiment: 'neutral' },
        { date: 'May', value: 40, sentiment: 'negative' },
        { date: 'Jun', value: 50, sentiment: 'neutral' },
      ]
    },
    {
      topic: 'Reliability',
      data: [
        { date: 'Jan', value: 20, sentiment: 'negative' },
        { date: 'Feb', value: 25, sentiment: 'negative' },
        { date: 'Mar', value: 30, sentiment: 'neutral' },
        { date: 'Apr', value: 40, sentiment: 'positive' },
        { date: 'May', value: 45, sentiment: 'positive' },
        { date: 'Jun', value: 50, sentiment: 'positive' },
      ]
    }
  ];

  // Get color for the chart based on sentiment trend
  const getTopicColor = (topic: string) => {
    switch (topic) {
      case 'Performance': return '#4ADE80'; // green
      case 'UI/UX': return '#F59E0B'; // amber
      case 'Reliability': return '#3B82F6'; // blue
      default: return '#9CA3AF'; // gray
    }
  };

  // For a real implementation, you would use a charting library like recharts, chart.js, or apex charts
  // This is a simplified placeholder visualization
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-[#1F2937]">Topic Distribution Over Time</h2>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
      
      <div className="h-64 relative">
        {/* This is where you would render your actual chart */}
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500 text-sm">
            Time series chart placeholder - would be implemented with a chart library
          </p>
        </div>
        
        {/* Mock chart legend */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-6 mt-4">
          {timeData.map((series, index) => (
            <div key={index} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: getTopicColor(series.topic) }}
              ></div>
              <span className="text-sm text-gray-600">{series.topic}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 