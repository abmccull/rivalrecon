"use client";

import { Lightbulb, DollarSign, Package, Beaker, MoreHorizontal } from 'lucide-react';
import { Analysis } from '@/lib/analysis';

interface StrategicRecommendationsProps {
  analysis: Analysis;
}

export default function StrategicRecommendations({ analysis }: StrategicRecommendationsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-[#1F2937]">
          <Lightbulb className="inline-block text-[#2DD4BF] mr-2 h-5 w-5" />
          Strategic Recommendations
        </h2>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-[#2DD4BF]/10 flex items-center justify-center text-[#2DD4BF]">
              <DollarSign className="h-5 w-5" />
            </div>
            <h3 className="font-medium text-[#1F2937] ml-3">Pricing Strategy</h3>
          </div>
          <p className="text-gray-700 text-sm">
            Consider introducing a subscription model with 15-20% discount to address price concerns while maintaining premium positioning.
          </p>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-[#2DD4BF]/10 flex items-center justify-center text-[#2DD4BF]">
              <Package className="h-5 w-5" />
            </div>
            <h3 className="font-medium text-[#1F2937] ml-3">Packaging Improvements</h3>
          </div>
          <p className="text-gray-700 text-sm">
            Reinforce shipping boxes and evaluate can design to address the 23% of complaints about damaged products during delivery.
          </p>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-[#2DD4BF]/10 flex items-center justify-center text-[#2DD4BF]">
              <Beaker className="h-5 w-5" />
            </div>
            <h3 className="font-medium text-[#1F2937] ml-3">Product Line Expansion</h3>
          </div>
          <p className="text-gray-700 text-sm">
            Develop citrus and berry flavors based on customer requests to expand product line and increase customer retention.
          </p>
        </div>
      </div>
    </div>
  );
} 