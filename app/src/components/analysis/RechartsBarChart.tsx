"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface BarChartData {
  name: string;
  value: number;
  comparison?: number;
  difference?: number;
}

interface RechartsBarChartProps {
  data: BarChartData[];
  title: string;
  description?: string;
  barColor?: string;
  comparisonBarColor?: string;
  height?: number;
  showComparison?: boolean;
}

export default function RechartsBarChart({
  data,
  title,
  description,
  barColor = "#2DD4BF",
  comparisonBarColor = "#1E3A8A",
  height = 240,
  showComparison = false
}: RechartsBarChartProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
      {description && <p className="text-gray-600 mb-4">{description}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 16, right: 16, left: 16, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => {
              return [`${value}`, name === 'comparison' ? 'Competitor' : 'Your Product'];
            }}
          />
          {showComparison && <Legend />}
          <Bar dataKey="value" name="Your Product" fill={barColor} />
          {showComparison && <Bar dataKey="comparison" name="Competitor" fill={comparisonBarColor} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
