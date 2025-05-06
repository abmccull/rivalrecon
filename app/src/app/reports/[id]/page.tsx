import { createClient } from '@/lib/supabase/server';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { redirect } from 'next/navigation';
import RatingsTimelineChart from '@/components/charts/RatingsTimelineChart';
import ReportDetailContent from '@/components/reports/ReportDetailContent';

// Define parameter types using Next.js 15 pattern
type ReportParams = { id: string };

// Generate static metadata for the page
export async function generateMetadata({ params }: { params: Promise<ReportParams> }) {
  const { id } = await params; // Await params
  return {
    title: `Report: ${id}`,
  };
}

// Next.js 15 page component for dynamic routes
export default async function ReportPage({ params }: { params: Promise<ReportParams> }) {
  // Await params
  const { id } = await params;

  // Validate route parameter
  if (!id) {
    redirect('/dashboard');
  }

  // Create the server-side Supabase client
  const supabase = await createClient();

  // Verify user authentication
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data?.user) {
    redirect('/login');
  }

  // Initialize variables
  let report: any = null;
  let fetchError: any = null;
  let sentimentPositive = 0;
  let sentimentNegative = 0;
  let sentimentNeutral = 0;
  let avgRating = 0;
  let reviewCount = 0;
  let topPositives: string[] = [];
  let topNegatives: string[] = [];
  let keyThemes: string[] = [];
  let wordMap: Record<string, number> = {};
  let trending: string | null = null;
  let competitiveInsights: string[] = [];
  let improvementOpportunities: string[] = [];
  let ratingDistribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  let ratingsOverTime: Record<string, number> = {};

  // Fetch report by ID with joined submission data
  try {
    const cleanId = id.trim();

    const analysisResponse = await supabase
      .from('analyses')
      .select('*, submissions:submission_id(*)')
      .eq('submission_id', cleanId)
      .order('created_at', { ascending: false });

    if (analysisResponse.data && analysisResponse.data.length > 0) {
      report = analysisResponse.data[0];
      fetchError = analysisResponse.error;

      if (report) {

        // Assign direct fields
        sentimentPositive = report.sentiment_positive_score ?? 0;
        sentimentNegative = report.sentiment_negative_score ?? 0;
        sentimentNeutral = report.sentiment_neutral_score ?? 0;
        avgRating = report.average_rating ?? 0;
        reviewCount = report.review_count ?? 0;
        trending = report.trending ?? null;

        // Function to safely parse JSON fields
        const safeJsonParse = (field: string, defaultValue: any = []) => {
          if (report[field] && typeof report[field] === 'string') {
            try {
              const parsed = JSON.parse(report[field]);
              return parsed;
            } catch (e) {
              return defaultValue;
            }
          } else if (report[field]) {
            console.log(`Field ${field} is already parsed.`);
            return report[field];
          }
          console.log(`Field ${field} not found or not a string, using default.`);
          return defaultValue;
        };

        // Parse JSON fields
        topPositives = safeJsonParse('top_positives', []);
        topNegatives = safeJsonParse('top_negatives', []);
        keyThemes = safeJsonParse('key_themes', []);
        ratingDistribution = safeJsonParse('rating_distribution', { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 });
        ratingsOverTime = safeJsonParse('ratings_over_time', {});
        wordMap = safeJsonParse('word_map', {});
        competitiveInsights = safeJsonParse('competitive_insights', []);
        improvementOpportunities = safeJsonParse('opportunities', []);

        // Normalize rating distribution to percentages
        if (reviewCount > 0) {
          for (let i = 1; i <= 5; i++) {
            const key = String(i);
            ratingDistribution[key] = Math.round((ratingDistribution[key] / reviewCount) * 100);
          }
        }

        // Prepare sentiment data
        let sentimentData = {
          positive: '0%',
          neutral: '0%',
          negative: '0%',
          positiveNum: sentimentPositive,
          neutralNum: sentimentNeutral,
          negativeNum: sentimentNegative
        };

        const totalSentiment = sentimentPositive + sentimentNegative + sentimentNeutral;
        if (totalSentiment > 0) {
          sentimentData.positive = `${Math.round((sentimentPositive / totalSentiment) * 100)}%`;
          sentimentData.neutral = `${Math.round((sentimentNeutral / totalSentiment) * 100)}%`;
          sentimentData.negative = `${Math.round((sentimentNegative / totalSentiment) * 100)}%`;
        }
      }
    }
    
    // Handle fetch errors
    if (fetchError) {
      console.error('Error fetching report:', fetchError);
      return (
        <div className="p-8 max-w-4xl mx-auto">
          <DashboardHeader />
          <div className="bg-white rounded-lg shadow-md p-6 mt-6 text-center">
            <h1 className="text-xl font-bold text-red-500 mb-4">Error Loading Report</h1>
            <p className="text-gray-700 mb-4">We couldn't load the requested report data.</p>
            <p className="text-sm text-gray-500">Error code: {fetchError.code || 'Unknown'}</p>
            <p className="text-sm text-gray-500">Message: {fetchError.message || 'None'}</p>
            <p className="text-sm text-gray-500">Details: {fetchError.details || 'None'}</p>
            <p className="text-xs text-gray-400 mt-2">Report ID: {id}</p>
          </div>
        </div>
      );
    }

    // Handle report not found
    if (!report) {
      return (
        <div className="p-8 max-w-4xl mx-auto">
          <DashboardHeader />
          <div className="bg-white rounded-lg shadow-md p-6 mt-6 text-center">
            <h1 className="text-xl font-bold text-gray-800 mb-4">Report Not Found</h1>
            <p className="text-gray-700">The report with ID {id} doesn't exist or has been removed.</p>
          </div>
        </div>
      );
    }
  } catch (err) {
    console.error('Unexpected error fetching report:', err);
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <DashboardHeader />
        <div className="bg-white rounded-lg shadow-md p-6 mt-6 text-center">
          <h1 className="text-xl font-bold text-red-500 mb-4">Server Error</h1>
          <p className="text-gray-700 mb-4">We encountered an unexpected error when loading the report.</p>
          <p className="text-sm text-gray-500">Please try again later or contact support.</p>
        </div>
      </div>
    );
  }

  // Prepare sentiment data
  let sentimentData = {
    positive: '0%',
    neutral: '0%',
    negative: '0%',
    positiveNum: sentimentPositive,
    neutralNum: sentimentNeutral,
    negativeNum: sentimentNegative
  };

  const totalSentiment = sentimentPositive + sentimentNegative + sentimentNeutral;
  if (totalSentiment > 0) {
    sentimentData.positive = `${Math.round((sentimentPositive / totalSentiment) * 100)}%`;
    sentimentData.neutral = `${Math.round((sentimentNeutral / totalSentiment) * 100)}%`;
    sentimentData.negative = `${Math.round((sentimentNegative / totalSentiment) * 100)}%`;
  }

  // Parse additional JSON fields
  const fieldsToParse = ['feature_analysis', 'category_analysis', 'comparison_data'];
  fieldsToParse.forEach(field => {
    if (report[field] && typeof report[field] === 'string') {
      try {
        report[field] = JSON.parse(report[field]);
        console.log(`Successfully parsed ${field}`);
      } catch (e) {
        console.error(`Error parsing ${field} as JSON:`, e, `Raw value: ${report[field]}`);
      }
    }
  });

  // Protect text fields
  ['key_insights', 'summary', 'trending'].forEach(field => {
    if (report[field] && typeof report[field] === 'object') {
      console.warn(`Field ${field} was unexpectedly an object, converting back to string.`);
      report[field] = JSON.stringify(report[field]);
    }
  });

  const fullTitle = report.display_name || report.name || 'Report Details';
  const truncatedTitle = fullTitle.length > 100 ? `${fullTitle.substring(0, 100)}...` : fullTitle;

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      <DashboardHeader 
        submissionId={report?.submission_id} 
        submissionStatus={report?.submissions?.status}
      />
      <main className="container mx-auto px-4 md:px-6 py-8">
        {report && (
          <ReportDetailContent reportId={id}>
            <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div className="mb-4">
                <h1
                  className="text-2xl md:text-3xl font-bold text-gray-900 truncate"
                  title={fullTitle.length > 100 ? fullTitle : undefined}
                >
                  {truncatedTitle}
                </h1>
              </div>
              <div className="flex space-x-3">
                <button 
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2DD4BF]"
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
            <div id="analysis-summary" className="bg-white rounded-lg shadow-md p-6">
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
                    <span className="font-medium">{reviewCount || 0}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-gray-500">Avg. Rating</span>
                    <div className="flex items-center">
                      <span className="font-medium mr-1">{(avgRating || 0).toFixed(1)}</span>
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className="text-sm">
                            {star <= Math.floor(avgRating) ? '★' : star - 0.5 <= avgRating ? '★' : '☆'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
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
                    <div className="bg-green-500 h-2.5 rounded-l-full" style={{ width: sentimentData.positive }}></div>
                    <div className="bg-gray-400 h-2.5" style={{ width: sentimentData.neutral, marginLeft: sentimentData.positive }}></div>
                    <div className="bg-red-500 h-2.5 rounded-r-full" style={{ width: sentimentData.negative, marginLeft: `${parseFloat(sentimentData.positive) + parseFloat(sentimentData.neutral)}%` }}></div>
                  </div>
                </div>
                <div id="rating-distribution" className="bg-[#F7FAFC] rounded-lg p-4">
                  <h3 className="font-medium text-[#1F2937] mb-3">Rating Distribution</h3>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const stringRating = rating.toString();
                      const percentage = ratingDistribution[stringRating] || 0;
                      return (
                        <div key={rating} className="flex items-center">
                          <span className="text-sm w-8">{rating}★</span>
                          <div className="flex-1 mx-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-[#2DD4BF] h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-600">{percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div id="competitive-position" className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Category</span>
                      <span className="text-sm text-gray-900 truncate" title={report?.submissions?.category_name ?? 'N/A'}>
                        {report?.submissions?.category_name ?? 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Brand</span>
                      <span className="text-sm text-gray-900">
                        {report?.submissions?.brand_name ?? 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Price</span>
                      <span className="text-sm text-gray-900">
                        {report?.submissions?.price ? `$${parseFloat(report.submissions.price).toFixed(2)}` : 'N/A'}
                      </span>
                    </div>
                    {report?.submissions?.url && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500">Product URL</span>
                        <a 
                          href={report.submissions?.url ?? '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View Original
                        </a>
                      </div>
                    )}
                    {report?.submissions?.review_count !== null && report?.submissions?.review_count !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500">Total Reviews</span>
                        <span className="text-sm text-gray-900">{report.submissions.review_count}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 mt-20">
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-[#1E3A8A]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-[#1F2937]">
                    <span className="text-[#1E3A8A] mr-2">📋</span>
                    Product Overview
                  </h2>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {report.summary || 'No product summary available.'}
                </p>
              </div>
              <div id="key-topics" className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-[#1F2937]">
                    <span className="text-[#2DD4BF] mr-2">☁️</span>
                    Key Topics
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-[#1F2937] mb-2">Key Themes</h3>
                    <div className="flex flex-wrap gap-2">
                      {keyThemes.map((theme: string, index: number) => (
                        <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {theme}
                        </span>
                      ))}
                      {(!keyThemes || keyThemes.length === 0) && (
                        <p className="text-gray-500 italic">No key themes available</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#1F2937] mb-2">Frequently Mentioned Terms</h3>
                    {Object.keys(wordMap).length > 0 ? (
                      <div className="bg-[#F7FAFC] rounded-lg p-4 flex flex-wrap content-center justify-center gap-3">
                        {Object.entries(wordMap).map(([word, count], index) => {
                          const size = Number(count);
                          const fontSize = Math.max(12, Math.min(22, 12 + (size / 3)));
                          const fontWeight = size > 10 ? 'font-bold' : size > 5 ? 'font-medium' : 'font-normal';
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
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div id="key-insights-column" className="lg:col-span-1 space-y-8"></div>
              <div id="data-visualizations" className="lg:col-span-3 space-y-6">
                {Object.keys(ratingsOverTime).length > 0 && (
                  <div id="ratings-trend" className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-[#1F2937]">
                        <span className="text-[#2DD4BF] mr-2">📈</span>
                        Ratings Trend
                      </h2>
                    </div>
                    <RatingsTimelineChart 
                      data={ratingsOverTime} 
                      trend={trending || undefined} 
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div id="key-positives" className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-[#1F2937]">
                        <span className="text-green-500 mr-2">✓</span>
                        Top Positives
                      </h2>
                    </div>
                    <div className="space-y-3">
                      {topPositives.map((positive, index) => (
                        <div key={index} className="border-l-4 border-green-500 pl-3 py-1">
                          <p className="text-gray-700">{positive}</p>
                        </div>
                      ))}
                      {topPositives.length === 0 && (
                        <p className="text-gray-500 italic">No positive insights available</p>
                      )}
                    </div>
                  </div>
                  <div id="key-negatives" className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-[#1F2937]">
                        <span className="text-red-500 mr-2">✗</span>
                        Top Negatives
                      </h2>
                    </div>
                    <div className="space-y-3">
                      {topNegatives.map((negative, index) => (
                        <div key={index} className="border-l-4 border-red-500 pl-3 py-1">
                          <p className="text-gray-700">{negative}</p>
                        </div>
                      ))}
                      {topNegatives.length === 0 && (
                        <p className="text-gray-500 italic">No negative insights available</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <div id="competitive-insights" className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-[#1F2937]">
                        <span className="text-[#2DD4BF] mr-2">⚔️</span>
                        Competitive Insights
                      </h2>
                    </div>
                    <div className="space-y-3">
                      {competitiveInsights.map((insight, index) => (
                        <div key={index} className="flex items-start">
                          <span className="text-[#2DD4BF] mt-1 mr-2">•</span>
                          <p className="text-gray-700">{insight}</p>
                        </div>
                      ))}
                      {competitiveInsights.length === 0 && (
                        <p className="text-gray-500 italic">No competitive insights available</p>
                      )}
                    </div>
                  </div>
                  <div id="improvement-opportunities" className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-[#1F2937]">
                        <span className="text-[#2DD4BF] mr-2">🎯</span>
                        Improvement Opportunities
                      </h2>
                    </div>
                    <div className="space-y-4">
                      {improvementOpportunities.map((opportunity, index) => {
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
                      {improvementOpportunities.length === 0 && (
                        <p className="text-gray-500 italic">No improvement opportunities available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 hidden">
              <h2 className="text-lg font-bold text-[#1F2937] mb-4">Debug: Raw Report Data</h2>
              <pre className="bg-[#F7FAFC] rounded p-4 text-sm text-gray-800 overflow-x-auto">
                {JSON.stringify(report, null, 2)}
              </pre>
            </div>
          </div>
          </ReportDetailContent>
        )}
      </main>
    </div>
  );
}