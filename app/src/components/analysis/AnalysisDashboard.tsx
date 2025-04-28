"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
// Using absolute imports for all components to ensure reliable module resolution
import BreadcrumbActions from "@/components/analysis/BreadcrumbActions";
import AnalysisSummary from "@/components/analysis/AnalysisSummary";
import KeyInsightsColumn from "@/components/analysis/KeyInsightsColumn";
import DataVisualizations from "@/components/analysis/DataVisualizations";
import StrategicRecommendations from "@/components/analysis/StrategicRecommendations";
import Footer from "@/components/landing/Footer";
import { Analysis } from "@/lib/analysis";

interface AnalysisDashboardProps {
  analysis: Analysis;
}

export default function AnalysisDashboard({ analysis }: AnalysisDashboardProps) {
  console.log('[AnalysisDashboard] Component rendering with analysis:', {
    id: analysis?.id,
    display_name: analysis?.display_name,
    hasData: !!analysis
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    console.log('[AnalysisDashboard] useEffect running, analysis:', {
      id: analysis?.id,
      hasData: !!analysis
    });
    
    // Validate analysis data
    if (!analysis || !analysis.id) {
      console.log('[AnalysisDashboard] Error: Invalid analysis data');
      setError("Invalid analysis data");
      setLoading(false);
      return;
    }
    
    // Short timeout to ensure smooth transition
    console.log('[AnalysisDashboard] Setting timeout to finish loading');
    const timer = setTimeout(() => {
      console.log('[AnalysisDashboard] Loading complete');
      setLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [analysis]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7FAFC]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7FAFC]">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div id="dashboard" className="min-h-screen bg-[#F7FAFC]">
      {/* Main Content */}
      <main id="analysis-dashboard" className="container mx-auto px-4 md:px-6 py-8">
        <BreadcrumbActions analysis={analysis} />
        <AnalysisSummary analysis={analysis} />
        
        {/* Main Analysis Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Key Insights */}
          <KeyInsightsColumn analysis={analysis} />
          
          {/* Center & Right Columns - Data Visualizations */}
          <DataVisualizations analysis={analysis} />
        </div>
        
        {/* Recommendations Section */}
        <StrategicRecommendations analysis={analysis} />
      </main>
    </div>
  );
}
