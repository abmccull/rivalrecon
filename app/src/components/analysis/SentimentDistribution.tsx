"use client";

import { MoreHorizontal } from 'lucide-react';

type SentimentData = {
  type: 'positive' | 'negative' | 'neutral';
  value: number;
  color: string;
};

export default function SentimentDistribution() {
  // Sample data - in a real app, this would come from props or an API call
  const sentimentData: SentimentData[] = [
    { type: 'positive', value: 45, color: '#10B981' },
    { type: 'neutral', value: 30, color: '#6B7280' },
    { type: 'negative', value: 25, color: '#EF4444' },
  ];

  // Calculate total for percentage
  const total = sentimentData.reduce((acc, sentiment) => acc + sentiment.value, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-[#1F2937]">Sentiment Distribution</h2>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex justify-center mb-6">
        <div className="relative h-48 w-48">
          {/* This is a simplified donut chart representation */}
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Calculate start and end positions for each segment */}
            {sentimentData.reduce((acc, sentiment, index) => {
              const startAngle = acc.total;
              const percentage = sentiment.value / total;
              const angle = percentage * 360;
              const endAngle = startAngle + angle;
              
              // Calculate SVG arc parameters
              const startRadians = (startAngle - 90) * Math.PI / 180;
              const endRadians = (endAngle - 90) * Math.PI / 180;
              
              const x1 = 50 + 40 * Math.cos(startRadians);
              const y1 = 50 + 40 * Math.sin(startRadians);
              const x2 = 50 + 40 * Math.cos(endRadians);
              const y2 = 50 + 40 * Math.sin(endRadians);
              
              // Determine if the arc should be drawn the long way around
              const largeArcFlag = angle > 180 ? 1 : 0;
              
              // Create the SVG path
              const path = `
                <path 
                  d="M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z"
                  fill="${sentiment.color}"
                />
              `;
              
              // Append to SVG
              acc.svg += path;
              acc.total = endAngle;
              return acc;
            }, { svg: '', total: 0 }).svg}
            
            {/* Center circle for donut effect */}
            <circle cx="50" cy="50" r="25" fill="white" />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-800">
              {sentimentData.find(s => s.type === 'positive')?.value}%
            </span>
            <span className="text-sm text-gray-500">Positive</span>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="grid grid-cols-3 gap-2">
        {sentimentData.map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="flex items-center mb-1">
              <div 
                className="w-3 h-3 rounded-full mr-1"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-600 capitalize">{item.type}</span>
            </div>
            <span className="text-sm font-semibold">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
} 