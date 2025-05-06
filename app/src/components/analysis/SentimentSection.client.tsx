"use client";
import dynamic from 'next/dynamic';

// Define proper types for the Plotly component
interface PlotlyProps {
  data: any[];
  layout?: any;
  config?: any;
  frames?: any[];
  style?: React.CSSProperties;
  useResizeHandler?: boolean;
  className?: string;
}

// Fix the dynamic import to properly handle the Plot component
const Plot = dynamic<PlotlyProps>(() => import('react-plotly.js').then(mod => mod.default), { ssr: false });

interface SentimentSectionProps {
  sentimentPositive: number;
  sentimentNegative: number;
  sentimentNeutral: number;
  productName?: string;
  reviewCount?: number;
  averageRating?: number;
}

export default function SentimentSection({
  sentimentPositive,
  sentimentNegative,
  sentimentNeutral,
  productName = 'N/A',
  reviewCount = 0,
  averageRating = 0,
}: SentimentSectionProps) {
  return (
    <div className="p-6 bg-white shadow-md rounded-lg mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Sentiment & Summary</h2>
      <div className="flex flex-col space-y-4">
        <div className="text-gray-800 text-sm">
          <p><strong>Product:</strong> {productName}</p>
          <p><strong>Total Reviews:</strong> {reviewCount}</p>
          <p><strong>Average Rating:</strong> {averageRating ? averageRating.toFixed(1) : 'N/A'}/5.0</p>
        </div>
        <div className="h-40">
          {typeof window !== 'undefined' && (
            <Plot
              data={[{
                type: 'indicator',
                mode: 'gauge+number',
                value: sentimentPositive,
                gauge: {
                  axis: { range: [0, 100] },
                  bar: { color: '#00A896' },
                  bgcolor: '#F0F0F0',
                },
              }]}
              layout={{ margin: { t: 0, b: 0 }, height: 160, width: 320 }}
              config={{ displayModeBar: false }}
            />
          )}
        </div>
        <div className="h-40">
          {typeof window !== 'undefined' && (
            <Plot
              data={[{
                values: [sentimentPositive, sentimentNegative, sentimentNeutral],
                labels: ['Positive', 'Negative', 'Neutral'],
                type: 'pie',
                marker: { colors: ['#00A896', '#F94144', '#F9C74F'] },
                hole: .4,
                hoverinfo: 'label+percent',
                textinfo: 'none'
              }]}
              layout={{ margin: { t: 0, b: 0 }, height: 160, width: 320, showlegend: true }}
              config={{ displayModeBar: false }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
