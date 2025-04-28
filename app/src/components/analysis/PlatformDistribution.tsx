"use client";

import { MoreHorizontal } from 'lucide-react';

type PlatformData = {
  name: string;
  value: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  color: string;
};

export default function PlatformDistribution() {
  // Sample data - in a real app, this would come from props or an API call
  const platformData: PlatformData[] = [
    { name: 'Twitter', value: 35, sentiment: 'neutral', color: '#1DA1F2' },
    { name: 'Reddit', value: 25, sentiment: 'negative', color: '#FF4500' },
    { name: 'Product Hunt', value: 15, sentiment: 'positive', color: '#DA552F' },
    { name: 'App Store', value: 15, sentiment: 'positive', color: '#0D96F6' },
    { name: 'Google Play', value: 10, sentiment: 'neutral', color: '#3DDC84' },
  ];

  // Calculate total for percentage
  const total = platformData.reduce((acc, platform) => acc + platform.value, 0);

  // Function to get text color based on background color brightness
  const getTextColor = (bgColor: string) => {
    // Convert hex to RGB
    const r = parseInt(bgColor.slice(1, 3), 16);
    const g = parseInt(bgColor.slice(3, 5), 16);
    const b = parseInt(bgColor.slice(5, 7), 16);
    
    // Calculate brightness (simplified version of YIQ formula)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Return black for bright colors, white for dark colors
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-[#1F2937]">Platform Distribution</h2>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
      
      <div className="space-y-4">
        {platformData.map((platform, index) => (
          <div key={index} className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-gray-700">
                  {platform.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-gray-700">
                  {(platform.value / total * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-6 mb-4 text-xs flex rounded-md">
              <div 
                style={{ width: `${(platform.value / total * 100)}%`, backgroundColor: platform.color }} 
                className="shadow-none flex flex-col text-center whitespace-nowrap justify-center"
              >
                <span 
                  className="px-2 py-1 text-xs font-bold" 
                  style={{ color: getTextColor(platform.color) }}
                >
                  {platform.value}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 