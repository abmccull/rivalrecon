import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Keyword {
  id: number;
  text: string;
  count: number;
}

export default function TopKeywords() {
  // Example keywords data
  const keywords: Keyword[] = [
    { id: 1, text: "Performance", count: 245 },
    { id: 2, text: "Interface", count: 198 },
    { id: 3, text: "Pricing", count: 184 },
    { id: 4, text: "Support", count: 152 },
    { id: 5, text: "Mobile", count: 131 },
    { id: 6, text: "Features", count: 127 },
    { id: 7, text: "Integration", count: 98 },
    { id: 8, text: "Bugs", count: 76 },
    { id: 9, text: "Documentation", count: 67 },
    { id: 10, text: "Reliability", count: 58 },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Top Keywords</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <Badge 
              key={keyword.id} 
              variant="outline" 
              className="px-2.5 py-1"
            >
              <span className="mr-1.5">{keyword.text}</span>
              <span className="text-xs text-muted-foreground">({keyword.count})</span>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 