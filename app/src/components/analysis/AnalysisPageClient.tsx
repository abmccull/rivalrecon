"use client";

import React from 'react';
import AnalysisDashboard from './AnalysisDashboard';
import { AnalysisError } from './AnalysisError';
import type { Analysis } from '@/lib/analysis';

interface AnalysisPageClientProps {
  analysisPromise: Promise<Analysis>;
}

export default function AnalysisPageClient({ analysisPromise }: AnalysisPageClientProps) {
  try {
    // Use React.use to unwrap the Promise in a client component
    const analysis = React.use(analysisPromise);
    
    return (
      <div className="min-h-screen bg-background">
        <AnalysisDashboard analysis={analysis} />
      </div>
    );
  } catch (error: any) {
    console.error("[AnalysisPageClient] Error:", error);
    return (
      <div className="min-h-screen bg-background">
        <AnalysisError message={error.message || 'Failed to load analysis'} />
      </div>
    );
  }
}
