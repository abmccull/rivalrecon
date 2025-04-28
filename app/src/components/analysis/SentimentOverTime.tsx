"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SentimentOverTime() {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Sentiment Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
          <p className="text-muted-foreground">Sentiment chart will be displayed here</p>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Positive</p>
            <p className="text-2xl font-bold text-emerald-500">46%</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Neutral</p>
            <p className="text-2xl font-bold text-slate-500">32%</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Negative</p>
            <p className="text-2xl font-bold text-red-500">22%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 