import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Topic {
  name: string;
  mentions: number;
  trend: "up" | "down" | "stable";
  change: string;
}

export default function TrendingTopics() {
  // Example trending topics data
  const topics: Topic[] = [
    { name: "Product Innovation", mentions: 342, trend: "up", change: "+18%" },
    { name: "Customer Experience", mentions: 287, trend: "up", change: "+12%" },
    { name: "Market Expansion", mentions: 256, trend: "down", change: "-5%" },
    { name: "Competitive Pricing", mentions: 198, trend: "stable", change: "+2%" },
    { name: "Digital Transformation", mentions: 175, trend: "up", change: "+24%" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Trending Topics</CardTitle>
        <Badge variant="outline" className="font-normal">
          <TrendingUp className="mr-1 h-3 w-3" />
          Last 30 days
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topics.map((topic, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-medium">{topic.name}</span>
                <span className="text-xs text-gray-500">{topic.mentions} mentions</span>
              </div>
              <Badge 
                variant={topic.trend === "up" ? "default" : topic.trend === "down" ? "destructive" : "outline"}
                className="font-normal"
              >
                {topic.change}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 