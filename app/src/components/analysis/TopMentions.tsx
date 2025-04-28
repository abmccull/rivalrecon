"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type KeywordMention = {
  keyword: string;
  count: number;
};

interface TopMentionsProps {
  data?: KeywordMention[];
}

export default function TopMentions({ data = [] }: TopMentionsProps) {
  // Sample data as fallback if no data is provided
  const fallbackMentions: KeywordMention[] = [
    { keyword: "Product Feature X", count: 145 },
    { keyword: "User Experience", count: 124 },
    { keyword: "Customer Support", count: 98 },
    { keyword: "Pricing", count: 78 },
    { keyword: "Mobile App", count: 63 },
  ];

  // Use provided data or fallback
  const mentions = data.length > 0 ? data : fallbackMentions;

  // Calculate the max count to determine percentages
  const maxCount = Math.max(...mentions.map(m => m.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Mentions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mentions.map((mention) => (
            <div key={mention.keyword} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium capitalize">{mention.keyword}</span>
                <span className="text-muted-foreground">{mention.count} mentions</span>
              </div>
              <Progress 
                value={(mention.count / maxCount) * 100} 
                className="h-2" 
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 