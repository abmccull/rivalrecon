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
import ErrorBoundary from "@/components/layout/ErrorBoundary";
import { Analysis } from "@/lib/analysis";

interface AnalysisDashboardProps {
  analysis: Analysis;
}

export default function AnalysisDashboard({ analysis }: AnalysisDashboardProps) {
  // Initialize component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {

    
    // Validate analysis data
    if (!analysis || !analysis.id) {

      setError("Invalid analysis data");
      setLoading(false);
      return;
    }
    
    // Short timeout to ensure smooth transition

    const timer = setTimeout(() => {

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
          <ErrorBoundary>
            <KeyInsightsColumn analysis={analysis} />
          </ErrorBoundary>
          
          {/* Center & Right Columns - Data Visualizations */}
          <ErrorBoundary>
            <DataVisualizations analysis={analysis} />
          </ErrorBoundary>
        </div>
        
        {/* Recommendations Section */}
        <ErrorBoundary>
          <StrategicRecommendations analysis={analysis} />
        </ErrorBoundary>
      </main>
    </div>
  );
}
