import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X } from "lucide-react";

// Example data for the feature comparison
const features = [
  { name: "Real-time alerts", yourProduct: true, competitorA: false, competitorB: true },
  { name: "Sentiment analysis", yourProduct: true, competitorA: true, competitorB: false },
  { name: "Unlimited reports", yourProduct: true, competitorA: false, competitorB: false },
  { name: "API access", yourProduct: true, competitorA: true, competitorB: true },
  { name: "Custom dashboards", yourProduct: true, competitorA: false, competitorB: true },
  { name: "Team collaboration", yourProduct: true, competitorA: false, competitorB: false },
];

export default function FeatureComparison() {
  return (
    <Card className="col-span-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Feature Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Feature</TableHead>
              <TableHead>Your Product</TableHead>
              <TableHead>Competitor A</TableHead>
              <TableHead>Competitor B</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {features.map((feature) => (
              <TableRow key={feature.name}>
                <TableCell className="font-medium">{feature.name}</TableCell>
                <TableCell>{feature.yourProduct ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}</TableCell>
                <TableCell>{feature.competitorA ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}</TableCell>
                <TableCell>{feature.competitorB ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 