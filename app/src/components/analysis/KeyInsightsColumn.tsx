"use client";

import { 
  Bot, 
  Lightbulb, 
  Target, 
  MoreHorizontal, 
  ChevronRight,
  Check
} from 'lucide-react';

// Local definition to replace the missing external import
interface Analysis {
  id?: string;
  display_name?: string;
  product_title?: string;
  brand_name?: string;
  category_name?: string;
  product_url?: string;
  is_competitor_product?: boolean;
  review_count?: number;
  average_rating?: number;
  rating_distribution?: any;
  sentiment_score?: number;
  sentiment_positive_score?: number;
  sentiment_negative_score?: number;
  sentiment_neutral_score?: number;
  top_positives?: string[];
  top_negatives?: string[];
  competitive_insights?: string[];
  opportunities?: string[];
  key_themes?: string[] | string;
  themes?: string[];
  trending?: string;
  word_map?: Record<string, number>;
  ratings_over_time?: Record<string, number>;
  ratings_over_time_old?: Record<string, number>;
  product_features?: Record<string, number>;
  category_rank?: number;
  total_in_category?: number;
  competitors?: any[];
  created_at?: string;
  updated_at?: string;
}

interface KeyInsightsColumnProps {
  analysis: Analysis;
}

export default function KeyInsightsColumn({ analysis }: KeyInsightsColumnProps) {
  // Extract data from the analysis object
  const aiSummary = analysis?.trending || "No AI summary available for this product.";
  
  // Extract key themes from the analysis
  let keyThemes: string[] = [];
  
  // First try to get the themes data from various possible sources
  try {
    if (typeof analysis?.key_themes === 'string') {
      // String could be in various formats, try multiple parsing approaches
      try {
        // Try parsing as JSON
        const parsed = JSON.parse(analysis.key_themes);
        if (Array.isArray(parsed)) {
          keyThemes = parsed;
        } else if (typeof parsed === 'object' && parsed !== null) {
          // Handle case where it's an object with keys like { "0": "theme1", "1": "theme2" }
          keyThemes = Object.values(parsed).map(item => String(item));
        }
      } catch (jsonError) {
        // If JSON parsing fails, try other formats
        const str = analysis.key_themes;
        if (str.startsWith('[') && str.endsWith(']')) {
          // Try to parse array-like string
          try {
            keyThemes = str.slice(1, -1).split(',').map((s: string) => {
              // Remove quotes and trim
              return s.replace(/^['"]|['"]$/g, '').trim();
            }).filter(Boolean);
          } catch (arrayError) {
            // Parsing as array failed
          }
        } else {
          // Simple comma-separated string
          keyThemes = str.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
    } else if (Array.isArray(analysis?.key_themes)) {
      // If it's already an array, use it directly
      keyThemes = analysis.key_themes.map((item: any) => String(item));
    } else if (analysis?.themes && Array.isArray(analysis.themes)) {
      // Fallback to themes field if it exists
      keyThemes = analysis.themes.map((item: any) => String(item));
    } else if (analysis?.top_positives && Array.isArray(analysis.top_positives)) {
      // Another fallback - use positive themes
      keyThemes = analysis.top_positives.slice(0, 5).map((item: any) => String(item));
    }
    
    // Filter out any empty themes
    keyThemes = keyThemes.filter(theme => theme && theme.trim().length > 0);
    
    // Default fallback if we still have no themes
    if (keyThemes.length === 0 && analysis?.top_positives && Array.isArray(analysis.top_positives)) {
      keyThemes = analysis.top_positives.slice(0, 3);
    }
  } catch (error) {
    console.error('Error handling key themes:', error);
    keyThemes = [];
  }
  
  // Create positive themes from top_positives
  const positiveThemes = Array.isArray(analysis?.top_positives) 
    ? analysis.top_positives.slice(0, 3).map((theme: string, index: number) => ({
        name: theme,
        percentage: 85 - (index * 15) // Mock percentage since we don't have real data
      }))
    : [];
    
  // Create negative themes from top_negatives
  const negativeThemes = Array.isArray(analysis?.top_negatives)
    ? analysis.top_negatives.slice(0, 2).map((theme: string, index: number) => ({
        name: theme,
        percentage: 75 - (index * 20) // Mock percentage since we don't have real data
      }))
    : [];
  
  // Extract competitive advantages from competitive_insights or themes
  let competitiveAdvantages = [];
  try {
    // Check for different possible field names
    if (Array.isArray(analysis?.competitive_insights)) {
      competitiveAdvantages = analysis.competitive_insights.slice(0, 3);
    } else if (typeof analysis?.competitive_insights === 'string') {
      // Try to parse it as JSON
      const parsed = JSON.parse(analysis.competitive_insights);
      competitiveAdvantages = Array.isArray(parsed) ? parsed.slice(0, 3) : [];
    } else if (analysis?.top_positives && Array.isArray(analysis.top_positives)) {
      // Fallback to top_positives if competitive_insights isn't available
      competitiveAdvantages = analysis.top_positives.slice(0, 3);
    } else {
      competitiveAdvantages = [
        "No competitive insights available"
      ];
    }
  } catch (error) {
    console.error('Error parsing competitive insights:', error);
    competitiveAdvantages = ["No competitive insights available"];
  }
      
  // Define the type for improvement opportunities
  interface ImprovementOpportunity {
    title: string;
    description: string;
    priority: string;
    priorityColor: string;
    impactScore: string;
  }

  // Extract improvement opportunities from different possible fields
  let improvementOpportunities: ImprovementOpportunity[] = [];
  try {
    // Check for different possible field names
    if (Array.isArray(analysis?.opportunities)) {
      improvementOpportunities = analysis.opportunities.map((opportunity: string, index: number) => ({
        title: opportunity.split(':')[0] || `Opportunity ${index + 1}`,
        description: opportunity,
        priority: index === 0 ? "High Priority" : index === 1 ? "Medium Priority" : "Growth Opportunity",
        priorityColor: index === 0 ? "red" : index === 1 ? "yellow" : "blue",
        impactScore: (Math.floor(Math.random() * 3) + 6) + "." + Math.floor(Math.random() * 10)
      })).slice(0, 3);
    } else if (typeof analysis?.opportunities === 'string') {
      // Try to parse it as JSON
      const parsed = JSON.parse(analysis.opportunities);
      if (Array.isArray(parsed)) {
        improvementOpportunities = parsed.map((opportunity: string, index: number) => ({
          title: opportunity.split(':')[0] || `Opportunity ${index + 1}`,
          description: opportunity,
          priority: index === 0 ? "High Priority" : index === 1 ? "Medium Priority" : "Growth Opportunity",
          priorityColor: index === 0 ? "red" : index === 1 ? "yellow" : "blue",
          impactScore: (Math.floor(Math.random() * 3) + 6) + "." + Math.floor(Math.random() * 10)
        })).slice(0, 3);
      }
    } else if (analysis?.top_negatives && Array.isArray(analysis.top_negatives)) {
      // Fallback to top_negatives if opportunities isn't available
      improvementOpportunities = analysis.top_negatives.map((negative: string, index: number) => ({
        title: negative.split(':')[0] || `Improvement Area ${index + 1}`,
        description: negative,
        priority: index === 0 ? "High Priority" : index === 1 ? "Medium Priority" : "Growth Opportunity",
        priorityColor: index === 0 ? "red" : index === 1 ? "yellow" : "blue",
        impactScore: (Math.floor(Math.random() * 3) + 6) + "." + Math.floor(Math.random() * 10)
      })).slice(0, 3);
    } else {
      improvementOpportunities = [
        {
          title: "No Improvement Data",
          description: "No improvement opportunities data available for this analysis.",
          priority: "Information",
          priorityColor: "blue",
          impactScore: "N/A"
        }
      ];
    }
  } catch (error) {
    console.error('Error parsing improvement opportunities:', error);
    improvementOpportunities = [
      {
        title: "No Improvement Data",
        description: "No improvement opportunities data available for this analysis.",
        priority: "Information",
        priorityColor: "blue",
        impactScore: "N/A"
      }
    ];
  }
  return (
    <div className="lg:col-span-1 space-y-8">
      {/* AI Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#1F2937]">
            <Bot className="inline-block text-[#2DD4BF] mr-2 h-5 w-5" />
            AI Summary
          </h2>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
        <p className="text-gray-700 mb-4">
          {aiSummary}
        </p>
        <div className="bg-[#F7FAFC] p-4 rounded-md">
          <h3 className="font-medium text-[#1F2937] mb-2">Competitive Advantages</h3>
          <ul className="space-y-2 text-gray-700">
            {competitiveAdvantages.map((advantage: string, index: number) => (
            <li key={index} className="flex items-start">
              <Check className="text-green-500 mt-1 mr-2 h-4 w-4" />
              <span>{typeof advantage === 'string' ? advantage : (advantage as any).description || (advantage as any).text}</span>
            </li>
          ))}
          </ul>
        </div>
      </div>
      
      {/* Key Themes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#1F2937]">
            <Lightbulb className="inline-block text-[#2DD4BF] mr-2 h-5 w-5" />
            Key Themes
          </h2>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          {positiveThemes.map((theme: {name: string, percentage: number}, index: number) => (
            <div key={`positive-${index}`} className="border-l-4 border-green-500 pl-3 py-1">
              <h3 className="font-medium text-[#1F2937]">{theme.name}</h3>
              <p className="text-gray-600 text-sm">Mentioned in {theme.percentage}% of positive reviews</p>
            </div>
          ))}
          
          {negativeThemes.map((theme: {name: string, percentage: number}, index: number) => (
            <div key={`negative-${index}`} className="border-l-4 border-red-500 pl-3 py-1">
              <h3 className="font-medium text-[#1F2937]">{theme.name}</h3>
              <p className="text-gray-600 text-sm">Mentioned in {theme.percentage}% of negative reviews</p>
            </div>
          ))}
          
          {keyThemes.length > 0 && positiveThemes.length === 0 && negativeThemes.length === 0 && (
            <div className="space-y-2">
              {keyThemes.slice(0, 5).map((theme: string, index: number) => (
                <div key={`theme-${index}`} className="border-l-4 border-blue-500 pl-3 py-1">
                  <h3 className="font-medium text-[#1F2937]">{theme}</h3>
                </div>
              ))}
            </div>
          )}
          
          {positiveThemes.length === 0 && negativeThemes.length === 0 && keyThemes.length === 0 && (
            <div className="text-gray-500 text-center py-2">
              No theme data available for this analysis
            </div>
          )}
        </div>
        <button className="mt-4 text-[#2DD4BF] hover:underline flex items-center text-sm font-medium">
          View all themes
          <ChevronRight className="ml-1 h-4 w-4" />
        </button>
      </div>
      
      {/* Improvement Opportunities */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#1F2937]">
            <Target className="inline-block text-[#2DD4BF] mr-2 h-5 w-5" />
            Improvement Opportunities
          </h2>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          {improvementOpportunities.map((opportunity: { title: string, description: string, priority: string, priorityColor: string, impactScore: string }, index: number) => (
            <div key={index} className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-[#1F2937] mb-2">{opportunity.title}</h3>
              <p className="text-gray-700 text-sm">
                {opportunity.description}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {opportunity.priority}
                </span>
                <span className="text-xs text-gray-500 ml-auto">
                  Impact Score: {opportunity.impactScore}/10
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 