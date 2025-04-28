"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SunDim } from "lucide-react";

export default function RegionalDistribution() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regional Distribution</CardTitle>
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
            <span className="ml-2 text-muted-foreground">Loading map data...</span>
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
    {region: 'North America', value: 45},
    {region: 'Europe', value: 30},
    {region: 'Asia', value: 15},
    {region: 'South America', value: 7},
    {region: 'Australia', value: 3}
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
    type: 'choropleth',
    locationmode: 'country names',
    locations: ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 
                'China', 'Japan', 'India', 'Brazil', 'Australia'],
    z: [35, 10, 12, 8, 7, 6, 5, 4, 7, 3],
    text: ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 
           'China', 'Japan', 'India', 'Brazil', 'Australia'],
    colorscale: [
      [0, '#E0F2FE'],
      [0.5, '#38BDF8'],
      [1, '#0369A1']
    ],
    autocolorscale: false,
    showscale: false,
    marker: {
      line: {
        color: 'rgb(255,255,255)',
        width: 1
      }
    }
  }];

  const layout = {
    geo: {
      showframe: false,
      showcoastlines: true,
      projection: {
        type: 'mercator'
      }
    },
    margin: {
      l: 0,
      r: 0,
      t: 0,
      b: 0
    },
    height: 320,
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
      useResizeHandler
    />
  );
} 