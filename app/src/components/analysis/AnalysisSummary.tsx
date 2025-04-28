"use client";

import { Star, StarHalf, Copy, ExternalLink } from 'lucide-react';
import { Analysis } from '@/lib/analysis';

interface AnalysisSummaryProps {
  analysis: Analysis;
}

export default function AnalysisSummary({ analysis }: AnalysisSummaryProps) {
  // Extract data from the analysis object with fallbacks
  const productName = analysis?.display_name || 'Product Name';
  const sentimentScore = analysis?.sentiment_score || 0;
  const sentimentPercentage = Math.round((sentimentScore || 0) * 100);
  
  // Extract review data
  const reviewCount = analysis?.review_count || 0;
  const averageRating = analysis?.average_rating || 0;
  
  // Extract rating distribution or provide fallback
  const ratingDistribution = analysis?.rating_distribution || {
    '5': 65,
    '4': 20,
    '3': 10,
    '2': 3,
    '1': 2
  };
  
  // Extract top positives and negatives
  const topPositives = analysis?.top_positives || [];
  const topNegatives = analysis?.top_negatives || [];
  
  // Extract competitive insights
  const competitiveInsights = analysis?.competitive_insights || [];
  
  // Determine sentiment status
  const getSentimentStatus = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Average';
    if (score >= 0.2) return 'Poor';
    return 'Critical';
  };
  
  const sentimentStatus = getSentimentStatus(sentimentScore);
  
  // Extract and format data from the analysis object
  const analysisData = {
    productName: analysis?.display_name || analysis?.product_title || "Untitled Product",
    competitor: analysis?.brand_name || "Unknown Brand",
    url: analysis?.product_url || "#",
    lastUpdated: analysis?.updated_at ? new Date(analysis.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : (analysis?.created_at ? new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })),
    reviewsCount: analysis?.review_count || 0,
    avgRating: analysis?.average_rating || 0,
    sentimentPositive: 67, // Default values since these aren't in the current schema
    sentimentNeutral: 20,
    sentimentNegative: 13,
    sentimentImprovement: 5,
    categoryRank: analysis?.category_rank || 1,
    totalInCategory: analysis?.total_in_category || 10,
    competitors: Array.isArray(analysis?.competitors) ? analysis.competitors.map((comp: any) => ({
      name: comp.name || comp.brand_name,
      rating: comp.rating || comp.avg_rating || 0
    })) : [
      // Fallback competitors if none are provided
      { name: "Competitor 1", rating: 4.0 },
      { name: "Competitor 2", rating: 3.8 },
      { name: "Competitor 3", rating: 3.5 }
    ]
  };

  return (
    <div id="analysis-summary" className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1F2937] mb-2">{productName}</h1>
            <div className="flex items-center text-gray-600">
              <span className="mr-2">{analysis?.brand_name || 'Brand'}</span>
              <span className="mx-2">•</span>
              <span className="mr-2">{analysis?.category_name || 'Category'}</span>
              <span className="mx-2">•</span>
              <span>{analysis?.is_competitor_product ? 'Competitor Product' : 'Your Product'}</span>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end">
            <div className="flex items-center mb-2">
              <div className="text-4xl font-bold text-[#1F2937] mr-3">{averageRating ? averageRating.toFixed(1) : '4.2'}</div>
              <div className="flex flex-col">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < Math.round(averageRating || 4) ? "text-yellow-400" : "text-gray-300"}>★</span>
                  ))}
                </div>
                <span className="text-sm text-gray-600">Based on {reviewCount ? reviewCount.toLocaleString() : '0'} reviews</span>
              </div>
            </div>
            <div className="bg-[#F7FAFC] p-3 rounded-md">
              <div className="flex items-center">
                <div className="w-24 text-sm text-gray-700">Sentiment:</div>
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#2DD4BF]" style={{ width: `${sentimentPercentage}%` }}></div>
                  </div>
                </div>
                <div className="ml-3 text-sm font-medium text-gray-700">{sentimentStatus} ({sentimentPercentage}%)</div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {/* Rating Distribution */}
          <div className="bg-[#F7FAFC] p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Rating Distribution</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating: number) => {
                const percentage = ratingDistribution?.[rating.toString()] || 0;
                return (
                  <div key={rating} className="flex items-center">
                    <span className="text-xs text-gray-600 w-6">{rating}★</span>
                    <div className="flex-1 mx-2">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#2DD4BF]" style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 w-8 text-right">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Top Positives */}
          <div className="bg-[#F7FAFC] p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Top Positives</h3>
            <ul className="space-y-2 text-sm">
              {topPositives.slice(0, 4).map((positive: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">+</span>
                  <span className="text-gray-600">{positive}</span>
                </li>
              ))}
              {topPositives.length === 0 && (
                <li className="text-gray-500">No positive insights available</li>
              )}
            </ul>
          </div>
          
          {/* Top Negatives */}
          <div className="bg-[#F7FAFC] p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Top Negatives</h3>
            <ul className="space-y-2 text-sm">
              {topNegatives.slice(0, 4).map((negative: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">-</span>
                  <span className="text-gray-600">{negative}</span>
                </li>
              ))}
              {topNegatives.length === 0 && (
                <li className="text-gray-500">No negative insights available</li>
              )}
            </ul>
          </div>
          
          {/* Competitive Insights */}
          <div className="bg-[#F7FAFC] p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Competitive Insights</h3>
            <ul className="space-y-2 text-sm">
              {competitiveInsights.slice(0, 4).map((insight: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className="text-gray-600">{insight}</span>
                </li>
              ))}
              {competitiveInsights.length === 0 && (
                <li className="text-gray-500">No competitive insights available</li>
              )}
            </ul>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Last Updated</span>
            <span className="font-medium text-gray-700">{analysisData.lastUpdated}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">Category Rank</span>
            <span className="font-medium text-[#1E3A8A]">#{analysisData.categoryRank} of {analysisData.totalInCategory}</span>
          </div>
        </div>
      </div>
    </div>
  );
}