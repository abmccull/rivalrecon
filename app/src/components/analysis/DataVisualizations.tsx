"use client";

import { useState, useEffect, useMemo } from 'react';
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
import { Analysis } from '@/lib/analysis';

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

// Define interfaces for our real data structures
interface RealSentimentDataPoint {
  date: string;
  rating: number;
}

interface RealFeatureDataPoint {
  feature: string;
  score: number;
}

interface DataVisualizationsProps {
  analysis: Analysis;
}

export default function DataVisualizations({ analysis }: DataVisualizationsProps) {
  const [sentimentData, setSentimentData] = useState<SentimentTrendDataPoint[]>([]);
  const [featureData, setFeatureData] = useState<FeatureComparisonDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Process analysis data to extract visualization data
  useEffect(() => {
    // Process analysis data for visualization
    setIsLoading(true);
    setError(null);

    try {
      // Use a timeout to ensure the state updates don't block rendering
      setTimeout(() => {
        if (!analysis) {
          throw new Error('Analysis data is missing');
        }

        // 1. Process sentiment trend data
        let sentimentTrendData: SentimentTrendDataPoint[] = [];

        try {
          // First check for ratings_over_time_old since that's what seems to be present in the data
          if (analysis.ratings_over_time_old && typeof analysis.ratings_over_time_old === 'object') {
            const entries = Object.entries(analysis.ratings_over_time_old);
            
            if (entries.length > 0) {
              sentimentTrendData = entries.map(([date, rating]) => ({
                name: date,
                positive: Math.round(((Number(rating) || 0) / 5) * 70), // Simulate positive percentage
                neutral: Math.round(((Number(rating) || 0) / 5) * 20), // Simulate neutral percentage
                negative: Math.round(100 - (((Number(rating) || 0) / 5) * 90)), // Simulate negative percentage
                overall: Math.round(((Number(rating) || 0) / 5) * 100) // Overall score as percentage
              }));
            }
          } else if (analysis.ratings_over_time && typeof analysis.ratings_over_time === 'object') {
            const entries = Object.entries(analysis.ratings_over_time);
            
            if (entries.length > 0) {
              sentimentTrendData = entries.map(([date, rating]) => ({
                name: date,
                positive: Math.round(((Number(rating) || 0) / 5) * 70),
                neutral: Math.round(((Number(rating) || 0) / 5) * 20),
                negative: Math.round(100 - (((Number(rating) || 0) / 5) * 90)),
                overall: Math.round(((Number(rating) || 0) / 5) * 100)
              }));
            }
          }

          // If we couldn't extract sentiment data, set error
          if (sentimentTrendData.length === 0) {
            throw new Error('No sentiment trend data available');
          }

          setSentimentData(sentimentTrendData);
        } catch (sentimentError) {
          console.error('[DataVisualizations] Error processing sentiment data:', sentimentError);
          throw sentimentError;
        }

        // 2. Process feature comparison data
        let featureComparisonData: FeatureComparisonDataPoint[] = [];

        try {
          if (analysis.product_features && typeof analysis.product_features === 'object') {
            const entries = Object.entries(analysis.product_features);
            
            if (entries.length > 0) {
              featureComparisonData = entries.map(([feature, score]) => ({
                name: feature,
                value: Number(score) || 0,
                comparison: Math.round(Math.random() * 80) + 20, // In a real app, comparison data would come from the backend
                difference: Math.round(((Number(score) || 0) - 50) / 5) // Simplified calculation for demo
              }));
            }
          } else if (analysis.word_map && typeof analysis.word_map === 'object') {
            // Using word_map as fallback for feature data
            const entries = Object.entries(analysis.word_map || {});
            
            if (entries.length > 0) {
              // Sort by value descending and take top 10
              const topEntries = entries
                .sort(([, a], [, b]) => Number(b) - Number(a))
                .slice(0, 10);
                
              featureComparisonData = topEntries.map(([word, count]) => ({
                name: word,
                value: Number(count) || 0,
                comparison: Math.round(Math.random() * 80) + 20, // In a real app, comparison data would come from the backend
                difference: Math.round(((Number(count) || 0) - 50) / 5) // Simplified calculation for demo
              }));
            }
          }

          // If we couldn't extract feature data, set error
          if (featureComparisonData.length === 0) {
            throw new Error('No feature comparison data available');
          }

          setFeatureData(featureComparisonData);
        } catch (featureError) {
          console.error('[DataVisualizations] Error processing feature data:', featureError);
          throw featureError;
        }
        
        setIsLoading(false);
      }, 100); // Short timeout to prevent blocking the UI thread
    } catch (error) {
      console.error('[DataVisualizations] Error in data processing:', error);
      setError(error instanceof Error ? error.message : 'Failed to process analysis data');
      setSentimentData([]);
      setFeatureData([]);
      setIsLoading(false);
    }
  }, [analysis]); // Only re-run when analysis changes

  // Empty sentiment samples for dropdown rendering
  const sentimentSamples = useMemo(() => [], []);

  // Empty feature samples for dropdown
  const featureSamples = useMemo(() => [], []);
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="animate-pulse p-8 bg-white rounded-lg shadow-md">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded mb-6"></div>
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="p-8 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <HelpCircle className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Data Unavailable</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render data visualizations
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
              defaultValue="monthly"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        {sentimentData.length > 0 ? (
          <RechartsLineChart data={sentimentData} />
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
            <h3 className="text-xl font-semibold">Feature Comparison</h3>
          </div>
          <div className="relative">
            <select 
              className="bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-[#2DD4BF]"
              defaultValue="top"
            >
              <option value="top">Top Features</option>
              <option value="improved">Most Improved</option>
              <option value="declined">Most Declined</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        {featureData.length > 0 ? (
          <RechartsBarChart data={featureData} />
        ) : (
          <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <HelpCircle className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No Data Available</h3>
              <p className="mt-1 text-sm text-gray-500">Feature comparison data is not available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
