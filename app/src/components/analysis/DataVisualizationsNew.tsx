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
import ErrorBoundary from '@/components/layout/ErrorBoundary';
import RechartsLineChart from './RechartsLineChart';
import RechartsBarChart from './RechartsBarChart';

// Define interfaces for data structures
interface SentimentTrendDataPoint {
  name: string;
  positive: number;
  neutral: number;
  negative: number;
  overall: number;
  [key: string]: number | string;
}

interface FeatureComparisonDataPoint {
  name: string;
  value: number;
  comparison: number;
  difference: number;
}

interface DataVisualizationsProps {
  analysis: any; // Will be properly typed once we know the final shape
}

export default function DataVisualizations({ analysis }: DataVisualizationsProps) {
  const [sentimentFilter, setSentimentFilter] = useState('weekly');
  const [keyTermsFilter, setKeyTermsFilter] = useState('positive');
  const [sentimentData, setSentimentData] = useState<SentimentTrendDataPoint[]>([]);
  const [featureData, setFeatureData] = useState<FeatureComparisonDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // In a real implementation, we would extract data from the analysis object
    // or fetch from an API endpoint
    try {
      setLoading(true);
      
      if (!analysis) {
        throw new Error('Analysis data is missing');
      }
      
      // Here we'd process the real data from the analysis object
      // For now, we'll set empty arrays to show the "no data" state
      setSentimentData([]);
      setFeatureData([]);
      
      // In a production app, we would set error states based on missing data
      if (!sentimentData.length && !featureData.length) {
        setError('No visualization data available for this analysis');
      } else {
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process analysis data');
    } finally {
      setLoading(false);
    }
  }, [analysis]);

  // Show loading state
  if (loading) {
    return (
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Show error state if needed
  if (error) {
    return (
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <HelpCircle className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Data Unavailable</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 space-y-8">
      {/* Sentiment Trends Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <TrendingUp className="text-[#2DD4BF] mr-2 h-5 w-5" />
            <h3 className="text-xl font-semibold">Sentiment Trends</h3>
          </div>
          <div className="relative">
            <select 
              className="bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-[#2DD4BF]"
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        {sentimentData.length > 0 ? (
          <ErrorBoundary>
            <RechartsLineChart data={sentimentData} title="Sentiment Trends Over Time" />
          </ErrorBoundary>
        ) : (
          <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <HelpCircle className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No Data Available</h3>
              <p className="mt-1 text-sm text-gray-500">Sentiment trend data is not available</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Feature Comparison Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BarChart3 className="text-[#2DD4BF] mr-2 h-5 w-5" />
            <h3 className="text-xl font-semibold">Key Term Analysis</h3>
          </div>
          <div className="relative">
            <select 
              className="bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-[#2DD4BF]"
              value={keyTermsFilter}
              onChange={(e) => setKeyTermsFilter(e.target.value)}
            >
              <option value="positive">Positive Terms</option>
              <option value="negative">Negative Terms</option>
              <option value="trending">Trending Terms</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        {featureData.length > 0 ? (
          <ErrorBoundary>
            <RechartsBarChart data={featureData} title="Key Term Analysis" />
          </ErrorBoundary>
        ) : (
          <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <HelpCircle className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No Data Available</h3>
              <p className="mt-1 text-sm text-gray-500">Key term analysis data is not available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
