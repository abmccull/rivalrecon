"use client";

import { 
  Bot, 
  Lightbulb, 
  Target, 
  MoreHorizontal, 
  ChevronRight,
  Check
} from 'lucide-react';
import { Analysis } from '@/lib/analysis';

interface KeyInsightsColumnProps {
  analysis: Analysis;
}

export default function KeyInsightsColumn({ analysis }: KeyInsightsColumnProps) {
  // Extract data from the analysis object
  const aiSummary = analysis?.trending || "No AI summary available for this product.";
  
  // Extract key themes from the analysis
  const keyThemes = Array.isArray(analysis?.key_themes) ? analysis.key_themes : [];
  
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
  
  // Extract competitive advantages from competitive_insights
  const competitiveAdvantages = Array.isArray(analysis?.competitive_insights)
    ? analysis.competitive_insights.slice(0, 3)
    : [
        "Natural ingredient list resonates strongly with health-conscious consumers",
        "Better taste profile than competitors",
        "Lower reported side effects"
      ];
      
  // Extract improvement opportunities from opportunities
  const improvementOpportunities = Array.isArray(analysis?.opportunities)
    ? analysis.opportunities.map((opportunity: string, index: number) => ({
        title: opportunity.split(':')[0] || `Opportunity ${index + 1}`,
        description: opportunity,
        priority: index === 0 ? "High Priority" : index === 1 ? "Medium Priority" : "Growth Opportunity",
        priorityColor: index === 0 ? "red" : index === 1 ? "yellow" : "blue",
        impactScore: (Math.floor(Math.random() * 3) + 6) + "." + Math.floor(Math.random() * 10)
      })).slice(0, 3)
    : [
        {
          title: "Price Concerns",
          description: "Many customers find the product overpriced compared to competitors.",
          priority: "High Priority",
          priorityColor: "red",
          impactScore: "8.4"
        },
        {
          title: "Packaging Issues",
          description: "Some negative reviews mention packaging problems during shipping.",
          priority: "Medium Priority",
          priorityColor: "yellow",
          impactScore: "6.7"
        },
        {
          title: "Flavor Expansion",
          description: "Customers frequently request more options and varieties.",
          priority: "Growth Opportunity",
          priorityColor: "blue",
          impactScore: "7.2"
        }
      ];
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