"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SunDim } from "lucide-react";

interface SentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
}

interface SentimentAnalysisProps {
  sentimentData?: SentimentDistribution;
}

export default function SentimentAnalysis({ sentimentData }: SentimentAnalysisProps) {
  const [mounted, setMounted] = useState(false);
  
  // Default data if none is provided
  const defaultSentimentData: SentimentDistribution = {
    positive: 65,
    neutral: 23,
    negative: 12,
  };
  
  // Use provided data or fallback to default
  const dataToUse = sentimentData || defaultSentimentData;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sentiment Analysis</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {mounted ? (
          <div className="relative h-full w-full flex items-center justify-center">
            {typeof document !== "undefined" && (
              <ChartRenderer data={dataToUse} />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <SunDim className="h-8 w-8 animate-pulse text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading sentiment analysis...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChartRenderer({ data }: { data: SentimentDistribution }) {
  const [Plot, setPlot] = useState<any>(null);

  useEffect(() => {
    // Dynamically import to avoid SSR issues
    const loadPlotly = async () => {
      try {
        const plotlyModule = await import("react-plotly.js");
        setPlot(() => plotlyModule.default);
      } catch (error) {
        console.error("Failed to load Plotly:", error);
      }
    };
    
    loadPlotly();
  }, []);

  if (!Plot) {
    return <div>Loading...</div>;
  }

  const chartData = [
    {
      values: [data.positive, data.neutral, data.negative],
      labels: ['Positive', 'Neutral', 'Negative'],
      type: 'pie',
      hole: 0.5,
      marker: {
        colors: ['#22c55e', '#f59e0b', '#ef4444']
      },
      textinfo: 'label+percent',
      insidetextorientation: 'radial'
    }
  ];

  const layout = {
    showlegend: false,
    margin: {
      l: 20,
      r: 20,
      t: 20,
      b: 20
    },
    height: 300,
    width: 400,
    dragmode: false, // Disable drag mode
    scrollZoom: false // Disable scroll zoom
  };

  const config = { 
    displayModeBar: false,
    scrollZoom: false,  // Disable scroll zoom in config too
    responsive: true,
    staticPlot: true // Make plot static (no interactions)
  };

  return (
    <Plot
      data={chartData}
      layout={layout}
      config={config}
      style={{ width: '100%', height: '100%' }}
    />
  );
} 