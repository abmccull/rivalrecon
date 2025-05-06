"use client";

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// Define the type for our ratings data
export type MonthlyRating = {
  month: string; // Format: "YYYY-MM"
  rating: number;
  count?: number; // Number of reviews for this month
  percentChange?: number; // Optional percent change from previous month
};

type RatingsTimelineChartProps = {
  data: Record<string, number> | Record<string, {average: number, count: number}> | MonthlyRating[]; // Accept both formats
  title?: string;
  subtitle?: string;
  trend?: string;
};

export default function RatingsTimelineChart({ 
  data, 
  title = "Ratings Over Time", 
  subtitle,
  trend 
}: RatingsTimelineChartProps) {
  
  // Transform data if needed and calculate percent changes
  const chartData = useMemo(() => {
    let formattedData: MonthlyRating[] = [];
    
    // Handle different data formats
    if (!Array.isArray(data)) {
      // Check if we have the enhanced format with count information
      const isEnhancedFormat = Object.values(data).some(value => 
        typeof value === 'object' && value !== null && 'average' in value && 'count' in value
      );
      
      if (isEnhancedFormat) {
        // Handle enhanced format with average and count
        formattedData = Object.entries(data)
          .map(([month, info]: [string, any]) => ({
            month,
            rating: parseFloat(info.average.toString()),
            count: parseInt(info.count.toString())
          }))
          .sort((a, b) => a.month.localeCompare(b.month)); // Sort by date
      } else {
        // Handle legacy Record<string, number> format
        formattedData = Object.entries(data)
          .map(([month, rating]) => ({
            month,
            rating: parseFloat(rating.toString()),
          }))
          .sort((a, b) => a.month.localeCompare(b.month)); // Sort by date
      }
    } else {
      // Handle array format
      formattedData = [...data].sort((a, b) => a.month.localeCompare(b.month));
    }
    
    // Calculate percent changes
    return formattedData.map((item, index, array) => {
      if (index === 0) {
        return { ...item, percentChange: 0 };
      }
      
      const prevRating = array[index - 1].rating;
      const change = ((item.rating - prevRating) / prevRating) * 100;
      return {
        ...item,
        percentChange: parseFloat(change.toFixed(1))
      };
    });
  }, [data]);
  
  // Calculate y-axis domain for adaptive scaling (±1 from min/max)
  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 5]; // Default domain
    
    const ratings = chartData.map(item => item.rating);
    const min = Math.min(...ratings);
    const max = Math.max(...ratings);
    
    // Ensure the domain is within [0, 5] range for ratings
    return [
      Math.max(0, Math.floor(min) - 1),
      Math.min(5, Math.ceil(max) + 1)
    ];
  }, [chartData]);
  
  // Format date for display with two-digit year
  const formatMonth = (month: string) => {
    if (!month) return '';
    try {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      const monthName = date.toLocaleDateString(undefined, { month: 'short' });
      const twoDigitYear = year.slice(-2); // Get last two digits of year
      return `${monthName} '${twoDigitYear}`;
    } catch (e) {
      console.error('Error formatting month:', e);
      return month;
    }
  };
  
  // Format tooltip content
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const date = new Date(data.month);
      const formattedDate = date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long' 
      });
      
      return (
        <div className="bg-white p-3 shadow-md rounded-md border border-gray-200">
          <p className="font-semibold text-[#1F2937]">{formattedDate}</p>
          <p className="text-[#2DD4BF]">Rating: {data.rating.toFixed(2)}</p>
          {data.count !== undefined && (
            <p className="text-blue-600">Based on {data.count} {data.count === 1 ? 'review' : 'reviews'}</p>
          )}
          {data.percentChange !== 0 && (
            <p className={data.percentChange > 0 ? "text-green-600" : "text-red-600"}>
              {data.percentChange > 0 ? "+" : ""}{data.percentChange}% from previous
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  
  // Custom dot for the line chart
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const change = payload.percentChange || 0;
    
    // Only show label for non-zero changes
    const showLabel = change !== 0;
    const changeText = change > 0 ? `+${change}%` : `${change}%`;
    
    // Color the dot based on change direction
    const dotColor = change >= 0 ? "#2DD4BF" : "#EF4444";
    
    return (
      <g>
        {/* The dot itself */}
        <circle 
          cx={cx} 
          cy={cy} 
          r={6} /* Increased dot size from 5 to 6 */
          fill={dotColor} 
          stroke="#fff" 
          strokeWidth={2} 
        />
        
        {/* The label for percent change */}
        {showLabel && (
          <text 
            x={cx} 
            y={cy - 16} /* Increased distance from dot */
            textAnchor="middle" 
            fill={change > 0 ? "#10B981" : "#EF4444"} 
            fontSize={12} /* Increased font size from 11 to 12 */
            fontWeight={600}
          >
            {changeText}
          </text>
        )}
      </g>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-full">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[#1F2937]">{title}</h2>
        {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        {trend && (
          <div className="mt-2 text-sm">
            <span className="font-medium">Trend: </span>
            <span className="text-gray-700">{trend}</span>
          </div>
        )}
      </div>
      
      <div className="h-80">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 30, right: 30, left: 5, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
              <XAxis 
                dataKey="month" 
                tickFormatter={formatMonth}
                stroke="#94A3B8"
                tick={{ fontSize: 12 }} /* Larger month labels */
                tickMargin={8} /* Additional margin below labels */
              />
              <YAxis 
                domain={yAxisDomain}
                tickCount={6}
                stroke="#94A3B8"
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={chartData.reduce((sum, item) => sum + item.rating, 0) / chartData.length} 
                stroke="#CBD5E1" 
                strokeDasharray="3 3"
              />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="#1E3A8A" /* Brand blue color for the line */
                strokeWidth={3.5} /* Increased line weight from 2.5 to 3.5 */
                activeDot={{ r: 9, fill: "#2DD4BF" }} /* Increased active dot size from 8 to 9 */
                dot={<CustomDot />}
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            No ratings data available
          </div>
        )}
      </div>
    </div>
  );
}
