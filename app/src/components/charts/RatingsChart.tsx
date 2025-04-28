'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Label
} from 'recharts';

interface RatingsChartProps {
  data: Record<string, number>;
  title?: string;
}

export default function RatingsChart({ data, title }: RatingsChartProps) {
  // Convert the data object into an array format for Recharts
  const chartData = useMemo(() => {
    // Sort by date for proper trending
    return Object.entries(data)
      .sort(([periodA], [periodB]) => {
        return new Date(periodA).getTime() - new Date(periodB).getTime();
      })
      .map(([period, rating], index, array) => {
        // Calculate percentage change from previous period
        let percentChange = 0;
        if (index > 0) {
          const prevRating = Number(array[index - 1][1]);
          const currentRating = Number(rating);
          percentChange = ((currentRating - prevRating) / prevRating) * 100;
        }
        
        return {
          period,
          rating: Number(rating),
          percentChange: percentChange.toFixed(1)
        };
      });
  }, [data]);

  // Calculate the overall trend percentage change
  const overallChange = useMemo(() => {
    if (chartData.length < 2) return 0;
    const firstRating = chartData[0].rating;
    const lastRating = chartData[chartData.length - 1].rating;
    return ((lastRating - firstRating) / firstRating) * 100;
  }, [chartData]);

  // Format the period (assuming YYYY-MM format)
  const formatPeriod = (period: string) => {
    try {
      const [year, month] = period.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    } catch (e) {
      return period;
    }
  };

  // Determine the stroke color based on trend
  const strokeColor = overallChange >= 0 ? '#10B981' : '#EF4444'; // Green for positive, red for negative

  // Find min and max ratings to determine domain
  const minRating = Math.floor(Math.min(...chartData.map(item => item.rating)) * 10) / 10;
  const maxRating = Math.ceil(Math.max(...chartData.map(item => item.rating)) * 10) / 10;
  
  // Set y-axis domain with a minimum range of 1 (e.g., 3-4, 4-5) and padding
  const yAxisMin = Math.max(0, Math.min(3, minRating - 0.3)); // Never go below 0, try to start from 3 or below
  const yAxisMax = Math.min(5, Math.max(yAxisMin + 1, maxRating + 0.2)); // Never exceed 5, ensure at least 1 unit range

  // Custom dot renderer to show percentage changes
  const renderDot = (props: any) => {
    const { cx, cy, payload, index } = props;
    const percentChange = parseFloat(payload.percentChange);
    const dotId = `dot-${payload.period}-${index}`;
    
    // Skip the first point since it has no change
    if (payload.percentChange === "0.0") {
      return <circle key={`circle-${dotId}`} cx={cx} cy={cy} r={6} fill="#1E3A8A" />;
    }
    
    return (
      <g key={dotId}>
        <circle key={`circle-${dotId}`} cx={cx} cy={cy} r={6} fill={percentChange >= 0 ? "#10B981" : "#EF4444"} />
        {Math.abs(percentChange) >= 3 && ( // Only show for significant changes
          <text key={`text-${dotId}`} x={cx} y={cy - 15} textAnchor="middle" fill={percentChange >= 0 ? "#10B981" : "#EF4444"} fontSize={10}>
            {percentChange >= 0 ? "+" : ""}{percentChange}%
          </text>
        )}
      </g>
    );
  };

  // Custom tooltip to show percentage change
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const rating = data.rating;
      const percentChange = parseFloat(data.percentChange);
      const changeText = percentChange === 0 ? 
        "" : 
        ` (${percentChange > 0 ? "+" : ""}${percentChange}% from previous)`;

      return (
        <div className="bg-white p-2 border border-gray-200 shadow-md rounded">
          <p className="font-medium">{formatPeriod(label)}</p>
          <p className="text-sm">
            Rating: <span className="font-medium">{rating.toFixed(1)}/5.0</span>
          </p>
          {changeText && (
            <p className={`text-xs ${percentChange >= 0 ? "text-green-600" : "text-red-600"}`}>
              {changeText}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      {title && (
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-[#1F2937]">{title}</h3>
          <div className={`text-sm font-medium ${overallChange >= 0 ? "text-green-600" : "text-red-600"}`}>
            Overall: {overallChange > 0 ? "+" : ""}{overallChange.toFixed(1)}% change
          </div>
        </div>
      )}
      <div className="w-full h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.6} />
            <XAxis 
              dataKey="period" 
              tickFormatter={formatPeriod} 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              domain={[yAxisMin, yAxisMax]}
              tickCount={5}
              tick={{ fontSize: 12 }}
              label={{ value: 'Rating (out of 5)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Reference line for average Amazon rating ~4.5 */}
            <ReferenceLine 
              y={4.5} 
              stroke="#9CA3AF" 
              strokeDasharray="3 3"
              label={{
                value: 'Avg market rating (4.5)',
                position: 'right',
                fill: '#9CA3AF',
                fontSize: 10
              }}
            />
            
            <Line
              type="monotone"
              dataKey="rating"
              stroke={strokeColor}
              activeDot={{ r: 8 }}
              strokeWidth={3}
              name="Rating"
              dot={renderDot}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
