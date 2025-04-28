"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend,
  Tooltip
} from "recharts";

const data = [
  { name: "Twitter", value: 170, color: "#1DA1F2" },
  { name: "News", value: 130, color: "#EF4444" },
  { name: "Reddit", value: 90, color: "#FF4500" },
  { name: "Blogs", value: 45, color: "#10B981" },
  { name: "Forums", value: 40, color: "#6366F1" },
];

export default function SourcesBreakdown() {
  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Sources Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Total sources: 475
        </div>
      </CardContent>
    </Card>
  );
} 