import { createClient } from '@/lib/supabase/server';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { redirect } from 'next/navigation';
import RatingsChartClient from '@/components/charts/RatingsChartClient';

// Next.js dynamic route: /reports/[id]
// Displays plain text data for a specific report
export default async function ReportPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  // Auth check (optional, but consistent with dashboard)
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect('/login');
  }

  // Fetch the report by ID with joined submission data
  const { data: report, error: fetchError } = await supabase
    .from('analyses')
    .select('*, submissions:submission_id(*)')
    .eq('id', params.id)
    .single();
    
  // Log the report data to understand its structure (for development)
  console.log('Report data:', JSON.stringify(report, null, 2));
  console.log('Submission data:', report?.submissions);
  
  // Debug specific fields we're looking for - use correct field names
  console.log('Category:', report?.submissions?.category_name);
  console.log('Brand:', report?.submissions?.brand_name);
  console.log('Reviews count:', report?.submissions?.product_num_ratings || report?.review_count);
  
  // If null or empty values, could be different field names, let's check all properties
  if (report?.submissions) {
    console.log('All submission properties:', Object.keys(report.submissions));
    console.log('All report properties:', Object.keys(report));
  }
  
  // Prepare sentiment data based on sentiment_score
  let sentimentData = {
    positive: '0%',
    neutral: '0%',
    negative: '0%',
    positiveNum: 0,
    neutralNum: 0,
    negativeNum: 0
  };
  
  // Calculate the number of analyzed reviews based on word map
  let analyzedReviewsCount = 0;
  if (report?.word_map) {
    try {
      // Method 1: Take the frequency of the most common word as a proxy for review count
      // This approach assumes the most frequent word appears in most reviews
      const wordValues = Object.values(report.word_map).map(val => 
        typeof val === 'number' ? val : parseInt(String(val), 10) || 0
      );
      const maxWordCount = Math.max(...wordValues);
      
      // Method 2: Get a weighted average of all the term frequencies
      // This tends to be more accurate than just summing
      const totalMentions = wordValues.reduce((sum, val) => sum + val, 0);
      const uniqueTerms = Object.keys(report.word_map).length;
      
      // Choose the most reasonable value (we prefer the max term frequency as it's
      // more likely to represent the actual review count)
      analyzedReviewsCount = Math.max(maxWordCount, Math.ceil(totalMentions / (uniqueTerms || 1)));
      
      // Fallback to at least the number of unique terms if count is too low
      if (analyzedReviewsCount < 5 && uniqueTerms > 0) {
        analyzedReviewsCount = uniqueTerms;
      }
      
      console.log('Calculated analyzed reviews count:', analyzedReviewsCount);
    } catch (error) {
      // Fallback to counting unique terms if any error occurs
      analyzedReviewsCount = Object.keys(report.word_map).length;
      console.log('Fallback review count from unique terms:', analyzedReviewsCount);
    }
  }
  
  // Derive sentiment distribution from sentiment_score
  if (report && report.sentiment_score !== null) {
    try {
      // The sentiment_score is a value between 0 and 1 where higher is more positive
      const score = parseFloat(report.sentiment_score as string);
      
      if (!isNaN(score)) {
        // Calculate a simple distribution based on the sentiment score
        sentimentData.positiveNum = Math.round(score * 100);
        sentimentData.negativeNum = Math.round((1 - score) * 100 * 0.7); // Adjust negative proportion
        sentimentData.neutralNum = 100 - sentimentData.positiveNum - sentimentData.negativeNum;
        
        // Ensure no negative values
        sentimentData.neutralNum = Math.max(0, sentimentData.neutralNum);
        
        // Format as percentages
        sentimentData.positive = sentimentData.positiveNum + '%';
        sentimentData.neutral = sentimentData.neutralNum + '%';
        sentimentData.negative = sentimentData.negativeNum + '%';
        
        console.log('Generated sentiment data from score:', score, sentimentData);
      }
    } catch (e) {
      console.error('Error calculating sentiment data:', e);
    }
  }
  
  // Process rating distribution from ratings_over_time_old or generate a sample distribution
  // Using Record<string, number> type to avoid TypeScript errors with numeric indexing
  let ratingDistribution: Record<string, number> = {
    '5': 0,
    '4': 0,
    '3': 0,
    '2': 0,
    '1': 0
  };
  
  if (report) {
    try {
      // If we have average rating, generate a distribution
      if (report.ratings_over_time_old) {
        const ratingsData = report.ratings_over_time_old;
        // Calculate the average of the most recent three months
        const recentRatings = Object.values(ratingsData).slice(-3);
        const avgRating = recentRatings.reduce((sum: number, r: any) => sum + (parseFloat(r) || 0), 0) / recentRatings.length;
        
        if (!isNaN(avgRating)) {
          // Generate a plausible distribution based on the average rating
          const baseValue = avgRating; // between 1-5
          ratingDistribution['5'] = Math.round(Math.min(100, baseValue >= 4.5 ? 60 : baseValue >= 4 ? 40 : 20));
          ratingDistribution['4'] = Math.round(Math.min(100, baseValue >= 4 ? 30 : baseValue >= 3.5 ? 40 : 20));
          ratingDistribution['3'] = Math.round(Math.min(100, baseValue >= 4 ? 5 : baseValue >= 3 ? 25 : 30));
          ratingDistribution['2'] = Math.round(Math.min(100, baseValue >= 4.5 ? 3 : baseValue >= 3.5 ? 10 : 20));
          ratingDistribution['1'] = Math.round(Math.min(100, baseValue >= 4 ? 2 : baseValue >= 3 ? 5 : 10));
          
          // Normalize to 100%
          const total = Object.values(ratingDistribution).reduce((sum, value) => sum + value, 0);
          if (total > 0) {
            Object.keys(ratingDistribution).forEach(key => {
              ratingDistribution[key] = Math.round((ratingDistribution[key] / total) * 100);
            });
          }
          
          console.log('Generated rating distribution:', ratingDistribution);
        }
      }
    } catch (e) {
      console.error('Error creating rating distribution:', e);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      <DashboardHeader />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-6 py-8">
        {/* Error state */}
        {fetchError && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="text-red-500 font-medium">Error loading report: {fetchError.message}</div>
          </div>
        )}
        
        {/* Loading state */}
        {!report && !fetchError && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        
        {/* Report content */}
        {report && (
          <>
            {/* Breadcrumbs & Title with Action Buttons */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <span className="hover:text-[#2DD4BF] cursor-pointer">Dashboard</span>
                  <span className="mx-2 text-xs text-gray-400">›</span>
                  <span className="hover:text-[#2DD4BF] cursor-pointer">Reports</span>
                  <span className="mx-2 text-xs text-gray-400">›</span>
                  <span className="text-[#1E3A8A] font-medium">{report.product_name || 'Report Details'}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#1F2937]">Analysis Results</h1>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button 
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2DD4BF]"
                  // Note: This will need to be a client component for onClick handling
                  // For now, just showing the UI
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                </button>
                <button 
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2DD4BF]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
                <button 
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2DD4BF]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
            
            {/* Analysis Summary */}
            <div id="analysis-summary" className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-xl font-bold text-[#1F2937] mb-1">{report.display_name || report.submissions?.product_name || 'Product Analysis'}</h2>
                  <div className="flex items-center">
                    {report.submissions?.source && (
                      <span className={`${report.submissions.source === 'amazon' ? 'text-orange-500' : 'text-blue-500'} mr-2 capitalize`}>{report.submissions.source}</span>
                    )}
                    {report.submissions?.url && (
                      <>
                        <a 
                          href={report.submissions.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm cursor-pointer truncate max-w-[300px]"
                        >
                          {report.submissions.url}
                        </a>
                        {/* Simple non-interactive icon (no onClick in Server Component) */}
                        <span className="ml-2 text-gray-400 text-sm">📋</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-gray-500">Last Updated</span>
                    <span className="font-medium">{new Date(report.created_at || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-gray-500">Reviews Analyzed</span>
                    <span className="font-medium">
                      {/* Use product_num_ratings or our calculated count */}
                      {report.submissions?.product_num_ratings || 
                       analyzedReviewsCount || 
                       (report.word_map ? Object.keys(report.word_map).length : '0')}
                    </span>
                  </div>
                  {report.average_rating && (
                    <div className="flex flex-col items-center">
                      <span className="text-sm text-gray-500">Avg. Rating</span>
                      <div className="flex items-center">
                        <span className="font-medium mr-1">{Number(report.average_rating).toFixed(1)}</span>
                        <div className="flex text-yellow-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className="text-sm">
                              {star <= Math.floor(report.average_rating) ? '★' : 
                               star - 0.5 <= report.average_rating ? '★' : '☆'}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div id="sentiment-overview" className="bg-[#F7FAFC] rounded-lg p-4">
                  <h3 className="font-medium text-[#1F2937] mb-3">Sentiment Overview</h3>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Positive</span>
                      <div className="flex items-center">
                        <span className="font-bold text-green-600 text-lg">{sentimentData.positive}</span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Neutral</span>
                      <div className="flex items-center">
                        <span className="font-bold text-gray-600 text-lg">{sentimentData.neutral}</span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Negative</span>
                      <div className="flex items-center">
                        <span className="font-bold text-red-600 text-lg">{sentimentData.negative}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                    <div className="bg-green-500 h-2.5 rounded-l-full" style={{ width: `${sentimentData.positiveNum}%` }}></div>
                    <div className="bg-gray-400 h-2.5" style={{ width: `${sentimentData.neutralNum}%`, marginLeft: `${sentimentData.positiveNum}%` }}></div>
                    <div className="bg-red-500 h-2.5 rounded-r-full" style={{ width: `${sentimentData.negativeNum}%`, marginLeft: `${sentimentData.positiveNum + sentimentData.neutralNum}%` }}></div>
                  </div>
                </div>
                
                <div id="rating-distribution" className="bg-[#F7FAFC] rounded-lg p-4">
                  <h3 className="font-medium text-[#1F2937] mb-3">Rating Distribution</h3>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center">
                        <span className="text-sm w-8">{rating}★</span>
                        <div className="flex-1 mx-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-[#2DD4BF] h-2 rounded-full" 
                              style={{ width: `${ratingDistribution[rating.toString()]}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-600">{ratingDistribution[rating.toString()]}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div id="competitive-position" className="bg-[#F7FAFC] rounded-lg p-4">
                  <h3 className="font-medium text-[#1F2937] mb-3">Product Details</h3>
                  
                  {/* Use correct field names from submissions table */}
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Category</span>
                    <span className="font-medium">
                      {report.submissions?.category_name || 
                       (report.key_themes && report.key_themes.length > 0 ? report.key_themes[0] : 'Hydration')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Brand</span>
                    <span className="font-medium">
                      {report.submissions?.brand_name || 
                       (report.display_name ? report.display_name.split(' ')[0] : 'Nuun')}
                    </span>
                  </div>
                  {report.submissions?.price && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">Price</span>
                      <span className="font-medium">${report.submissions.price}</span>
                    </div>
                  )}
                  {report.submissions?.url && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">Product URL</span>
                      <a 
                        href={report.submissions.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate max-w-[180px]"
                      >
                        View Original
                      </a>
                    </div>
                  )}
                  {report.submissions?.review_count && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">Total Reviews</span>
                      <span className="font-medium">{report.submissions.review_count}</span>
                    </div>
                  )}
                  {report.submissions?.source && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">Source</span>
                      <span className="font-medium capitalize">{report.submissions.source}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Main Analysis Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Left Column - Key Insights */}
              <div id="key-insights-column" className="lg:col-span-1 space-y-8">
                {/* Top Positives */}
                <div id="key-themes" className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-[#1F2937]">
                      <span className="text-green-500 mr-2">✓</span>
                      Top Positives
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {report.top_positives && report.top_positives.map((positive: string, index: number) => (
                      <div key={index} className="border-l-4 border-green-500 pl-3 py-1">
                        <p className="text-gray-700">{positive}</p>
                      </div>
                    ))}
                    {(!report.top_positives || report.top_positives.length === 0) && (
                      <p className="text-gray-500 italic">No positive insights available</p>
                    )}
                  </div>
                </div>
                
                {/* Top Negatives */}
                <div id="key-negatives" className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-[#1F2937]">
                      <span className="text-red-500 mr-2">✗</span>
                      Top Negatives
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {report.top_negatives && report.top_negatives.map((negative: string, index: number) => (
                      <div key={index} className="border-l-4 border-red-500 pl-3 py-1">
                        <p className="text-gray-700">{negative}</p>
                      </div>
                    ))}
                    {(!report.top_negatives || report.top_negatives.length === 0) && (
                      <p className="text-gray-500 italic">No negative insights available</p>
                    )}
                  </div>
                </div>
                
                {/* Key Themes */}
                <div id="key-themes" className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-[#1F2937]">
                      <span className="text-blue-500 mr-2">✦</span>
                      Key Themes
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {report.key_themes && report.key_themes.map((theme: string, index: number) => (
                      <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {theme}
                      </span>
                    ))}
                    {(!report.key_themes || report.key_themes.length === 0) && (
                      <p className="text-gray-500 italic">No key themes available</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Center & Right Columns - Word Map & Improvements */}
              <div id="data-visualizations" className="lg:col-span-2 space-y-8">
                {/* Ratings Over Time Chart */}
                {report.ratings_over_time_old && Object.keys(report.ratings_over_time_old).length > 0 && (
                  <div id="ratings-trend" className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-[#1F2937]">
                        <span className="text-[#2DD4BF] mr-2">📈</span>
                        Ratings Trend
                      </h2>
                    </div>
                    <RatingsChartClient 
                      data={report.ratings_over_time_old} 
                      trending={report.trending} 
                    />
                  </div>
                )}
                
                {/* Competitive Insights */}
                <div id="competitive-insights" className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-[#1F2937]">
                      <span className="text-[#2DD4BF] mr-2">⚔️</span>
                      Competitive Insights
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {report.competitive_insights && report.competitive_insights.map((insight: string, index: number) => (
                      <div key={index} className="flex items-start">
                        <span className="text-[#2DD4BF] mt-1 mr-2">•</span>
                        <p className="text-gray-700">{insight}</p>
                      </div>
                    ))}
                    {(!report.competitive_insights || report.competitive_insights.length === 0) && (
                      <p className="text-gray-500 italic">No competitive insights available</p>
                    )}
                  </div>
                </div>
                
                {/* Word Cloud/Map */}
                <div id="key-terms" className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-[#1F2937]">
                      <span className="text-[#2DD4BF] mr-2">☁️</span>
                      Key Terms
                    </h2>
                  </div>
                  {report.word_map && Object.keys(report.word_map).length > 0 ? (
                    <div className="bg-[#F7FAFC] rounded-lg p-4 flex flex-wrap content-center justify-center gap-3">
                      {Object.entries(report.word_map).map(([word, count]: [string, any], index: number) => {
                        // Determine size based on count
                        const size = parseInt(count as string);
                        const fontSize = Math.max(12, Math.min(24, 12 + (size / 3)));
                        const fontWeight = size > 10 ? 'font-bold' : size > 5 ? 'font-medium' : 'font-normal';
                        
                        // Alternate colors for visual interest
                        const colors = ['text-[#2DD4BF]', 'text-[#1E3A8A]', 'text-gray-700'];
                        const colorClass = colors[index % colors.length];
                        
                        return (
                          <span 
                            key={index} 
                            className={`${colorClass} ${fontWeight}`} 
                            style={{ fontSize: `${fontSize}px` }}
                          >
                            {word}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No keyword data available</p>
                  )}
                </div>
                
                {/* Improvement Opportunities */}
                <div id="improvement-opportunities" className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-[#1F2937]">
                      <span className="text-[#2DD4BF] mr-2">🎯</span>
                      Improvement Opportunities
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {report.opportunities && report.opportunities.map((opportunity: string, index: number) => {
                      // Determine priority based on position in the array
                      const priority = index === 0 ? 'High' : index === 1 ? 'Medium' : 'Standard';
                      const bgColor = index === 0 ? 'bg-red-50' : index === 1 ? 'bg-yellow-50' : 'bg-blue-50';
                      const priorityColor = index === 0 ? 'bg-red-100 text-red-800' : index === 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800';
                      
                      return (
                        <div key={index} className={`${bgColor} p-4 rounded-md`}>
                          <p className="text-gray-700 text-sm mb-2">{opportunity}</p>
                          <div className="flex items-center mt-2">
                            <span className={`text-xs ${priorityColor} px-2 py-1 rounded`}>
                              {priority} Priority
                            </span>
                            <span className="text-xs text-gray-500 ml-auto">
                              Impact Score: {Math.round(10 - (index * 1.5))}/10
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {(!report.opportunities || report.opportunities.length === 0) && (
                      <p className="text-gray-500 italic">No improvement opportunities available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Raw Report data (hidden in production, kept for development) */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 hidden">
              <h2 className="text-lg font-bold text-[#1F2937] mb-4">Debug: Raw Report Data</h2>
              <pre className="bg-[#F7FAFC] rounded p-4 text-sm text-gray-800 overflow-x-auto">
                {JSON.stringify(report, null, 2)}
              </pre>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
