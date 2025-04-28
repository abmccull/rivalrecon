"use client";

import { MoreHorizontal, ArrowUp, ArrowDown } from 'lucide-react';

type CompetitorMetric = {
  name: string;
  engagement: number;
  sentiment: number;
  reach: number;
  growth: number;
};

export default function CompetitorAnalysis() {
  // Sample data - in a real app, this would come from props or an API call
  const competitors: CompetitorMetric[] = [
    {
      name: "Your Company",
      engagement: 78,
      sentiment: 82,
      reach: 65,
      growth: 12
    },
    {
      name: "Competitor A",
      engagement: 65,
      sentiment: 70,
      reach: 73,
      growth: 8
    },
    {
      name: "Competitor B",
      engagement: 72,
      sentiment: 65,
      reach: 60,
      growth: -3
    },
    {
      name: "Competitor C",
      engagement: 58,
      sentiment: 75,
      reach: 80,
      growth: 15
    }
  ];

  const getColor = (value: number, isGrowth = false): string => {
    if (isGrowth) {
      return value > 0 ? "text-green-500" : value < 0 ? "text-red-500" : "text-gray-500";
    }
    return value >= 75 ? "text-green-500" : value >= 60 ? "text-yellow-500" : "text-red-500";
  };

  const getGrowthIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (value < 0) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-[#1F2937]">Competitor Analysis</h2>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="pb-2 font-medium">Competitor</th>
              <th className="pb-2 font-medium">Engagement</th>
              <th className="pb-2 font-medium">Sentiment</th>
              <th className="pb-2 font-medium">Reach</th>
              <th className="pb-2 font-medium">Growth</th>
            </tr>
          </thead>
          <tbody>
            {competitors.map((competitor, index) => (
              <tr 
                key={index} 
                className={`border-b ${index === 0 ? 'bg-blue-50' : ''}`}
              >
                <td className="py-4 font-medium">{competitor.name}</td>
                <td className={`py-4 ${getColor(competitor.engagement)}`}>
                  {competitor.engagement}%
                </td>
                <td className={`py-4 ${getColor(competitor.sentiment)}`}>
                  {competitor.sentiment}%
                </td>
                <td className={`py-4 ${getColor(competitor.reach)}`}>
                  {competitor.reach}%
                </td>
                <td className="py-4">
                  <div className="flex items-center">
                    {getGrowthIcon(competitor.growth)}
                    <span className={`ml-1 ${getColor(competitor.growth, true)}`}>
                      {Math.abs(competitor.growth)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 