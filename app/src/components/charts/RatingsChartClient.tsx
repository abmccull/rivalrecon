'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the chart component to avoid SSR issues with recharts
// This must be done in a client component
const RatingsChart = dynamic(
  () => import('./RatingsChart'),
  { ssr: false }
);

interface RatingsChartClientProps {
  data: Record<string, number>;
  title?: string;
  trending?: string;
}

export default function RatingsChartClient({ data, title, trending }: RatingsChartClientProps) {
  return (
    <div className="w-full">
      <RatingsChart data={data} title={title} />
      {trending && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
          <span className="font-medium">Trend Analysis:</span> {trending}
        </div>
      )}
    </div>
  );
}
