"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SunDim } from "lucide-react";

export default function ChannelPerformance() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel Performance</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {mounted ? (
          <div className="relative h-full w-full flex items-center justify-center">
            {typeof document !== "undefined" && (
              <ChartRenderer />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <SunDim className="h-8 w-8 animate-pulse text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading channel data...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChartRenderer() {
  const [Plot, setPlot] = useState<any>(null);

  // Sample data - would come from API in real implementation
  const data = [
    { channel: 'Social Media', value: 68 },
    { channel: 'Website', value: 52 },
    { channel: 'Email', value: 45 },
    { channel: 'Advertising', value: 39 },
    { channel: 'Direct', value: 27 }
  ];

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

  const chartData = [{
    x: data.map(item => item.value),
    y: data.map(item => item.channel),
    type: 'bar',
    orientation: 'h',
    marker: {
      color: [
        '#3b82f6',
        '#6366f1',
        '#8b5cf6',
        '#a855f7',
        '#d946ef'
      ]
    }
  }];

  const layout = {
    autosize: true,
    margin: {
      l: 120,
      r: 20,
      t: 20,
      b: 40
    },
    xaxis: {
      title: 'Engagement Score'
    },
    yaxis: {
      automargin: true
    },
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
      useResizeHandler
    />
  );
} 