"use client";

import { Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Insight {
  id: string | number;
  text: string;
}

interface KeyInsightsProps {
  insights?: Insight[];
}

export default function KeyInsights({ insights = [] }: KeyInsightsProps) {
  // Example insights data as fallback
  const fallbackInsights: Insight[] = [
    { 
      id: 1, 
      text: "Product usability issues mentioned in 68% of negative reviews" 
    },
    { 
      id: 2, 
      text: "Customer service response time is the most improved area since last quarter" 
    },
    { 
      id: 3, 
      text: "The new pricing model has received mixed feedback, with 40% positive and 45% negative mentions" 
    },
    { 
      id: 4, 
      text: "Feature requests focus primarily on mobile app improvements and integration capabilities" 
    },
    { 
      id: 5, 
      text: "Competitor X is gaining traction among our previous enterprise customers due to their new API" 
    }
  ];

  // Use provided insights if available, otherwise use fallback
  const insightsToShow = insights && insights.length > 0 ? insights : fallbackInsights;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Key Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {insightsToShow.map((insight) => (
            <li key={insight.id} className="flex items-start gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{insight.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
} 