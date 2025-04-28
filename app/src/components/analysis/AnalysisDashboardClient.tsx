"use client";
import React from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import AnalysisDashboard from "./AnalysisDashboard";
import type { Analysis } from "@/lib/analysis";

interface Props {
  analysis: Analysis | null;
}

export default function AnalysisDashboardClient({ analysis }: Props) {
  if (!analysis) {
    // Optionally, render a fallback or error message
    return null;
  }
  return (
    <ErrorBoundary>
      <AnalysisDashboard analysis={analysis} />
    </ErrorBoundary>
  );
}
