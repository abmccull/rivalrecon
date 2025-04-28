"use client";

import { useState, useEffect } from 'react';
import {
  ChevronDown,
  BarChart3,
  TrendingUp,
  MessageCircle,
  Zap,
  HelpCircle,
  MoreHorizontal,
  Cloud,
  MessageSquare,
  Download,
  Trash,
} from 'lucide-react';
import RechartsLineChart from './RechartsLineChart';
import RechartsBarChart from './RechartsBarChart';
import { 
  generateSentimentTrendData, 
  generateFeatureComparisonData,
  SentimentTrendDataPoint,
  FeatureComparisonDataPoint
} from '@/utils/mockAnalysisData';

interface DataVisualizationsProps {
  analysis: any; // Will be properly typed once we know the final shape
}

export default function DataVisualizations({ analysis }: DataVisualizationsProps) {
  const [sentimentFilter, setSentimentFilter] = useState('weekly');
  const [keyTermsFilter, setKeyTermsFilter] = useState('positive');
  const [sentimentData, setSentimentData] = useState<SentimentTrendDataPoint[]>([]);
  const [featureData, setFeatureData] = useState<FeatureComparisonDataPoint[]>([]);
  
  useEffect(() => {
    // Load mock data
    setSentimentData(generateSentimentTrendData());
    setFeatureData(generateFeatureComparisonData());
    
    // In a real implementation, we would fetch this data from Supabase
    // based on the analysis ID and any applied filters
  }, []);

  return (
    <div className="lg:col-span-2 space-y-8">
      {/* Sentiment Trends Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <TrendingUp className="text-[#2DD4BF] mr-2 h-5 w-5" />
            <h2 className="text-lg font-bold text-[#1F2937]">Sentiment Trends</h2>
          </div>
          <div className="flex space-x-4">
            <div className="relative">
              <button className="flex items-center text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-200">
                {sentimentFilter === 'weekly' ? 'Weekly' : sentimentFilter === 'monthly' ? 'Monthly' : 'Quarterly'}
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {sentimentData.length > 0 ? (
          <RechartsLineChart
            data={sentimentData}
            title=""
            height={280}
          />
        ) : (
          <div className="flex items-center justify-center h-64 w-full border border-dashed border-gray-300 rounded-lg">
            <div className="text-center p-4">
              <TrendingUp className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Loading sentiment trends...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Feature Comparison Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BarChart3 className="text-[#2DD4BF] mr-2 h-5 w-5" />
            <h2 className="text-lg font-bold text-[#1F2937]">Feature Comparison</h2>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
        
        {featureData.length > 0 ? (
          <RechartsBarChart
            data={featureData}
            title=""
            height={280}
            showComparison={true}
          />
        ) : (
          <div className="flex items-center justify-center h-64 w-full border border-dashed border-gray-300 rounded-lg">
            <div className="text-center p-4">
              <BarChart3 className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Loading feature comparison...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Key Terms Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Cloud className="text-[#2DD4BF] mr-2 h-5 w-5" />
            <h2 className="text-lg font-bold text-[#1F2937]">Key Terms</h2>
          </div>
          <div className="flex space-x-4">
            <div className="flex space-x-2">
              <button 
                className={`text-xs px-3 py-1 rounded-full ${
                  keyTermsFilter === 'positive' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setKeyTermsFilter('positive')}
              >
                Positive
              </button>
              <button 
                className={`text-xs px-3 py-1 rounded-full ${
                  keyTermsFilter === 'negative' 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setKeyTermsFilter('negative')}
              >
                Negative
              </button>
              <button 
                className={`text-xs px-3 py-1 rounded-full ${
                  keyTermsFilter === 'neutral' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setKeyTermsFilter('neutral')}
              >
                Neutral
              </button>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="h-64 w-full">
          {/* Placeholder for word cloud visualization */}
          <div className="flex items-center justify-center h-full w-full border border-dashed border-gray-300 rounded-lg">
            <div className="text-center p-4">
              <Cloud className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Word cloud visualization will appear here</p>
              <p className="text-xs text-gray-400 mt-1">Will be implemented with React 19-compatible library</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Reviews Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <MessageSquare className="text-[#2DD4BF] mr-2 h-5 w-5" />
            <h2 className="text-lg font-bold text-[#1F2937]">Recent Reviews</h2>
          </div>
          <div className="flex space-x-2">
            <button className="text-gray-400 hover:text-gray-600">
              <Download className="h-5 w-5" />
            </button>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Review items would go here */}
          <p className="text-sm text-gray-500 text-center py-8">Recent reviews will be displayed here.</p>
        </div>
      </div>
    </div>
  );
}
