"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SunDim } from "lucide-react";

interface RatingPeriod {
  date: string;
  average_rating: number;
  review_count?: number;
  sentiment_positive?: number;
  sentiment_neutral?: number;
  sentiment_negative?: number;
}

interface RatingsOverTimeProps {
  ratingsOverTime?: RatingPeriod[];
}

export default function RatingsOverTime({ ratingsOverTime = [] }: RatingsOverTimeProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ratings Over Time</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {mounted ? (
          <div className="relative h-full w-full flex items-center justify-center">
            {typeof document !== "undefined" && (
              <ChartRenderer data={ratingsOverTime} />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <SunDim className="h-8 w-8 animate-pulse text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading ratings data...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChartRenderer({ data }: { data: RatingPeriod[] }) {
  const [Plot, setPlot] = useState<any>(null);

  // Fallback data if none is provided
  const fallbackData: RatingPeriod[] = [
    { date: 'Jan', average_rating: 4.0 },
    { date: 'Feb', average_rating: 3.8 },
    { date: 'Mar', average_rating: 4.2 },
    { date: 'Apr', average_rating: 4.4 },
    { date: 'May', average_rating: 4.1 },
    { date: 'Jun', average_rating: 4.5 },
  ];

  // Use provided data if available, otherwise fallback
  const dataToUse = data && data.length > 0 ? data : fallbackData;

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

  // Generate marker colors based on ratings
  const markerColors = dataToUse.map(item => {
    const rating = item.average_rating;
    if (rating >= 4.25) {
      // Green (4.25-5.0)
      return `hsl(142, 85%, ${45 - ((rating - 4.25) * 10)}%)`;
    } else if (rating >= 3.5) {
      // Yellow (3.5-4.25)
      return `hsl(48, 85%, ${55 - ((rating - 3.5) * 10)}%)`;
    } else {
      // Red (0-3.5)
      return `hsl(0, 85%, ${65 - ((3.5 - Math.max(1, rating)) * 10)}%)`;
    }
  });

  const chartData = [
    {
      x: dataToUse.map(item => item.date),
      y: dataToUse.map(item => item.average_rating),
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Average Rating',
      line: {
        color: 'rgba(59, 130, 246, 0.5)',
        width: 3
      },
      marker: {
        color: markerColors,
        size: 10,
        line: {
          color: 'white',
          width: 1
        }
      }
    }
  ];

  // Add sentiment data if available
  if (dataToUse.some(item => item.sentiment_positive !== undefined)) {
    // Use a type cast for the entire object to avoid TypeScript errors with Plotly types
    chartData.push({
      x: dataToUse.map(item => item.date),
      y: dataToUse.map(item => item.sentiment_positive || 0),
      type: 'scatter',
      mode: 'lines',
      name: 'Positive %',
      line: { 
        color: 'rgba(22, 163, 74, 0.7)',
        width: 2,
        dash: 'dot'
      },
      yaxis: 'y2'
    } as any); // Type cast the entire object for Plotly compatibility
  }

  const layout = {
    autosize: true,
    margin: {
      l: 50,
      r: 50,
      t: 20,
      b: 50
    },
    xaxis: {
      title: 'Period'
    },
    yaxis: {
      title: 'Average Rating',
      range: [0, 5],
      gridcolor: 'rgba(0,0,0,0.1)',
      zerolinecolor: 'rgba(0,0,0,0.2)'
    },
    yaxis2: {
      title: 'Sentiment %',
      titlefont: {color: 'rgba(22, 163, 74, 0.9)'},
      tickfont: {color: 'rgba(22, 163, 74, 0.9)'},
      overlaying: 'y',
      side: 'right',
      range: [0, 100]
    },
    legend: {
      orientation: 'h',
      yanchor: 'bottom',
      y: -0.2,
      xanchor: 'center',
      x: 0.5,
      bgcolor: 'rgba(255,255,255,0.6)',
      bordercolor: 'rgba(0,0,0,0.1)',
      borderwidth: 1
    },
    dragmode: false, // Disable drag mode
    scrollZoom: false, // Disable scroll zoom
    paper_bgcolor: 'rgba(0,0,0,0)', // Transparent background
    plot_bgcolor: 'rgba(0,0,0,0)', // Transparent plot area
    font: {
      family: 'Inter, sans-serif'
    }
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
      useResizeHandler
    />
  );
} 