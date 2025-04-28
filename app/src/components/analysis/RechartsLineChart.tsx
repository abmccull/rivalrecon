"use client";

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Make this compatible with our SentimentTrendDataPoint interface from mockAnalysisData
interface LineChartData {
  name: string;
  positive: number;
  negative: number;
  neutral: number;
  overall: number;
  [key: string]: number | string;
}

interface RechartsLineChartProps {
  data: LineChartData[];
  title: string;
  description?: string;
  height?: number;
  lines?: Array<{
    dataKey: string;
    color: string;
    name?: string;
  }>;
}

export default function RechartsLineChart({
  data,
  title,
  description,
  height = 240,
  lines = [
    { dataKey: 'positive', color: '#10b981', name: 'Positive' },
    { dataKey: 'neutral', color: '#9ca3af', name: 'Neutral' },
    { dataKey: 'negative', color: '#ef4444', name: 'Negative' },
    { dataKey: 'overall', color: '#1e3a8a', name: 'Overall Score' },
  ]
}: RechartsLineChartProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
      {description && <p className="text-gray-600 mb-4">{description}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 16, right: 16, left: 16, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {lines.map((line, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name || line.dataKey}
              stroke={line.color}
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
