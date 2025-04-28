"use client";

import { useState, useEffect } from "react";
import AnalysisDashboard from "./AnalysisDashboard";
import { AnalysisError } from "./AnalysisError";
import type { Analysis } from "@/lib/analysis";

interface AnalysisDashboardWrapperProps {
  serializedAnalysis: string;
}

export default function AnalysisDashboardWrapper({ 
  serializedAnalysis 
}: AnalysisDashboardWrapperProps) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Parse serialized analysis data safely
  useEffect(() => {
    try {
      console.log("[AnalysisDashboardWrapper] Parsing serialized analysis data");
      const parsedAnalysis = JSON.parse(serializedAnalysis) as Analysis;
      setAnalysis(parsedAnalysis);
    } catch (err) {
      console.error("[AnalysisDashboardWrapper] Error parsing analysis data:", err);
      setError("Failed to parse analysis data. Please try again later.");
    }
  }, [serializedAnalysis]);
  
  if (error) {
    return <AnalysisError message={error} />;
  }
  
  if (!analysis) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7FAFC]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }
  
  return <AnalysisDashboard analysis={analysis} />;
}
