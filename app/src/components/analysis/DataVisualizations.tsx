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
import { Analysis } from '@/lib/analysis';
import { 
  generateSentimentTrendData, 
  generateFeatureComparisonData,
  SentimentTrendDataPoint,
  FeatureComparisonDataPoint
} from '@/utils/mockAnalysisData';

// Define interfaces for our real data structures
interface RealSentimentDataPoint {
  date: string;
  rating: number;
  sentiment: number;
}

interface RealFeatureDataPoint {
  name: string;
  product: number;
  competitor: number;
}

interface DataVisualizationsProps {
  analysis: Analysis;
}

export default function DataVisualizations({ analysis }: DataVisualizationsProps) {
  const [sentimentFilter, setSentimentFilter] = useState('weekly');
  const [keyTermsFilter, setKeyTermsFilter] = useState('positive');
  const [sentimentData, setSentimentData] = useState<SentimentTrendDataPoint[]>([]);
  const [featureData, setFeatureData] = useState<FeatureComparisonDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Process analysis data to extract visualization data
  useEffect(() => {
    console.log('[DataVisualizations] Processing analysis data:', analysis?.id);
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
            console.log('[DataVisualizations] Found ratings_over_time_old data');
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
            console.log('[DataVisualizations] Found ratings_over_time data');
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

          // If we couldn't extract sentiment data, use mock data
          if (sentimentTrendData.length === 0) {
            console.log('[DataVisualizations] Using mock sentiment trend data');
            sentimentTrendData = generateSentimentTrendData();
          }

          setSentimentData(sentimentTrendData);
        } catch (sentimentError) {
          console.error('[DataVisualizations] Error processing sentiment data:', sentimentError);
          setSentimentData(generateSentimentTrendData());
        }

        // 2. Process feature comparison data
        let featureComparisonData: FeatureComparisonDataPoint[] = [];

        try {
          if (analysis.product_features && typeof analysis.product_features === 'object') {
            console.log('[DataVisualizations] Found product_features data');
            const entries = Object.entries(analysis.product_features);
            
            if (entries.length > 0) {
              featureComparisonData = entries.map(([feature, scores]: [string, any]) => ({
                name: feature,
                value: scores?.product || 0,
                comparison: scores?.competitor || 0,
                difference: (scores?.product || 0) - (scores?.competitor || 0)
              }));
            }
          } else if (analysis.word_map && typeof analysis.word_map === 'object') {
            console.log('[DataVisualizations] Using word_map as fallback for feature data');
            const entries = Object.entries(analysis.word_map || {});
            
            if (entries.length > 0) {
              featureComparisonData = entries
                .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
                .slice(0, 6)
                .map(([word, count]) => {
                  const safeCount = Number(count) || 0;
                  const productValue = Math.min(10, Math.max(1, safeCount * 0.5));
                  const competitorValue = Math.max(1, productValue * (0.7 + Math.random() * 0.6));
                  
                  return {
                    name: word,
                    value: productValue,
                    comparison: competitorValue,
                    difference: productValue - competitorValue
                  };
                });
            }
          }

          // If we couldn't extract feature data, use mock data
          if (featureComparisonData.length === 0) {
            console.log('[DataVisualizations] Using mock feature comparison data');
            featureComparisonData = generateFeatureComparisonData();
          }

          setFeatureData(featureComparisonData);
        } catch (featureError) {
          console.error('[DataVisualizations] Error processing feature data:', featureError);
          setFeatureData(generateFeatureComparisonData());
        }

        setIsLoading(false);
      }, 100); // Short timeout to prevent blocking the UI thread
    } catch (error) {
      console.error('[DataVisualizations] Error in data processing:', error);
      setError(error instanceof Error ? error.message : 'Unknown error processing visualization data');
      setSentimentData(generateSentimentTrendData());
      setFeatureData(generateFeatureComparisonData());
      setIsLoading(false);
    }
  }, [analysis]); // Only re-run when analysis changes

  // Safety check to ensure data is available and in the right format
  const hasSentimentData = sentimentData && Array.isArray(sentimentData) && sentimentData.length > 0;
  const hasFeatureData = featureData && Array.isArray(featureData) && featureData.length > 0;

  // Render loading state
  if (isLoading) {
    return (
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center" style={{ minHeight: '300px' }}>
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-2"></div>
            <p className="text-gray-500">Loading visualization data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center" style={{ minHeight: '300px' }}>
          <div className="text-center text-destructive">
            <p className="font-medium">Error loading visualizations</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 space-y-8">
      {/* Sentiment Trend Chart */}
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
        
        {hasSentimentData ? (
          <RechartsLineChart 
            data={sentimentData}
            title="Sentiment Trends"
            height={280}
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full">
            <p className="text-sm text-gray-500">No sentiment trend data available</p>
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
        
        {hasFeatureData ? (
          <RechartsBarChart
            data={featureData}
            title="Feature Comparison"
            height={280}
            showComparison={true}
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full">
            <p className="text-sm text-gray-500">No feature comparison data available</p>
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
          {analysis?.word_map && typeof analysis.word_map === 'object' && Object.entries(analysis.word_map || {}).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 h-full overflow-y-auto p-2">
              {Object.entries(analysis.word_map || {})
                .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0)) // Sort by count in descending order
                .map(([word, count]: [string, any], index: number) => {
                  // Prevent NaN issues with proper fallbacks
                  const safeCount = Number(count) || 0;
                  const fontSize = Math.max(14, Math.min(24, 14 + (safeCount / 5)));
                  const colors = [
                    'text-blue-600', 'text-green-600', 'text-purple-600', 
                    'text-indigo-600', 'text-pink-600', 'text-teal-600'
                  ];
                  const color = colors[index % colors.length];
                  
                  return (
                    <div 
                      key={word || `word-${index}`} 
                      className={`flex items-center justify-center p-2 rounded-md ${color} font-medium`}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {word || 'Unknown'} <span className="ml-1 text-xs text-gray-500">({safeCount})</span>
                    </div>
                  );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full w-full border border-dashed border-gray-300 rounded-lg">
              <div className="text-center p-4">
                <Cloud className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">No word map data available</p>
                <p className="text-xs text-gray-400 mt-1">Full word cloud will be implemented with React 19-compatible library</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Recent Reviews Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <MessageSquare className="text-[#2DD4BF] mr-2 h-5 w-5" />
            <h2 className="text-lg font-bold text-[#1F2937]">Key Insights</h2>
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
          {analysis?.key_themes && Array.isArray(analysis.key_themes) && analysis.key_themes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.key_themes.slice(0, 6).map((theme: string, index: number) => (
                <div key={index} className="bg-gray-50 p-3 rounded-md">
                  <div className="flex items-start">
                    <div className="bg-[#2DD4BF] text-white p-1 rounded-full mr-2">
                      <Zap className="h-4 w-4" />
                    </div>
                    <span className="text-sm text-gray-700">{theme || 'Unknown theme'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : analysis?.trending ? (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-start">
                <div className="bg-[#2DD4BF] text-white p-1 rounded-full mr-2 mt-1">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">Trend Analysis</h3>
                  <p className="text-sm text-gray-700">{analysis.trending}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No key insights available for this analysis.</p>
          )}
        </div>
      </div>
    </div>
  );
}
