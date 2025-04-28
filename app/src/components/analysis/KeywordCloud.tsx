"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SunDim } from "lucide-react";

type KeywordData = {
  text: string;
  value: number;
};

interface KeywordCloudProps {
  keywords?: KeywordData[];
}

// KeywordCloud.tsx was deprecated and removed due to legacy word cloud libraries incompatibility with React 19.
// Use RechartsDemo.tsx or other Recharts-based components for visualization.

  const [mounted, setMounted] = useState(false);
  
  // Fallback data if no keywords are provided or the array is empty
  const fallbackKeywords: KeywordData[] = [
    { text: "hydration", value: 64 },
    { text: "electrolyte", value: 58 },
    { text: "sugar-free", value: 52 },
    { text: "flavor", value: 47 },
    { text: "dissolve", value: 42 },
    { text: "convenient", value: 39 },
    { text: "natural", value: 35 },
    { text: "packaging", value: 32 },
    { text: "headaches", value: 29 },
    { text: "price", value: 25 },
    { text: "alcohol", value: 22 },
    { text: "pregnancy", value: 19 },
  ];
  
  // Use provided keywords if available, otherwise use fallback
  const keywordsToUse = keywords && keywords.length > 0 ? keywords : fallbackKeywords;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Keyword Frequency</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {mounted ? (
          <div className="relative h-full w-full">
            {typeof document !== "undefined" && (
              <StaticWordCloud keywords={keywordsToUse} />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <SunDim className="h-8 w-8 animate-pulse text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading word cloud...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Enhanced word cloud with true randomized placement and varied styling
function StaticWordCloud({ keywords }: { keywords: KeywordData[] }) {
  // Sort keywords by value (descending) so larger words are placed first
  const sortedKeywords = [...keywords].sort((a, b) => b.value - a.value);
  
  // Color palette - distinct colors for better visual variety
  const colorPalette = [
    'hsl(210, 90%, 50%)',  // Blue
    'hsl(340, 80%, 45%)',  // Red
    'hsl(160, 80%, 40%)',  // Green
    'hsl(45, 90%, 50%)',   // Gold
    'hsl(280, 70%, 50%)',  // Purple
    'hsl(190, 90%, 45%)',  // Teal
    'hsl(30, 90%, 45%)',   // Orange
    'hsl(300, 70%, 45%)',  // Pink
    'hsl(120, 70%, 40%)',  // Lime
    'hsl(230, 80%, 55%)',  // Royal Blue
    'hsl(0, 80%, 45%)',    // Bright Red
    'hsl(170, 80%, 40%)',  // Turquoise
  ];
  
  return (
    <div className="relative w-full h-full overflow-hidden">
      {sortedKeywords.map((keyword, index) => {
        // Calculate font size based on value - more dramatic scaling
        const fontSize = 0.8 + (keyword.value / Math.max(...sortedKeywords.map(k => k.value))) * 2.2;
        
        // Get a color from our palette
        const color = colorPalette[index % colorPalette.length];
        
        // Generate random position using the index to ensure some basic distribution
        const ringRadius = Math.min(40, 10 + (index * 5)); // Starting closer to center for larger words
        const angle = index * (Math.PI * 0.5) + Math.random() * 0.5; // Semi-random angle
        const xPercent = 50 + Math.cos(angle) * ringRadius;
        const yPercent = 50 + Math.sin(angle) * ringRadius;
        
        // Random rotation - important words (larger) get less rotation
        const rotation = (keyword.value > 50) ? 
          (Math.random() * 8 - 4) : // Less rotation for important words
          (Math.random() * 30 - 15); // More rotation for smaller words
        
        // Adjust opacity based on value - more important = more opaque
        const opacity = 0.7 + (keyword.value / Math.max(...sortedKeywords.map(k => k.value))) * 0.3;
        
        return (
          <span
            key={index}
            className="absolute transform-gpu whitespace-nowrap px-1"
            style={{
              fontSize: `${fontSize}rem`,
              fontWeight: keyword.value > 40 ? 'bold' : 'normal',
              color: color,
              opacity: opacity,
              left: `${xPercent}%`,
              top: `${yPercent}%`,
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              zIndex: 100 - index, // Higher value words appear on top
              textShadow: keyword.value > 50 ? '0 0 1px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.3s ease-out',
            }}
          >
            {keyword.text}
          </span>
        );
      })}
    </div>
  );
} 