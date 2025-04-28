'use client';

import { Analysis } from "@/lib/analysis";

interface AnalysisDebugViewProps {
  serializedAnalysis: string;
}

/**
 * Simplified component to debug analysis data rendering issues
 */
export default function AnalysisDebugView({ serializedAnalysis }: AnalysisDebugViewProps) {
  try {
    // Parse the serialized data for display
    const analysis = JSON.parse(serializedAnalysis) as Analysis;
    
    console.log('[AnalysisDebugView] Rendering with analysis data:', { 
      id: analysis?.id,
      hasProps: !!analysis,
      keyCount: Object.keys(analysis || {}).length
    });

    // Simple display of key analysis properties
    return (
      <div className="p-8 bg-white rounded-lg shadow-lg max-w-4xl mx-auto mt-8">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Analysis Debug View</h1>
        
        <div className="border-b pb-4 mb-4">
          <h2 className="text-xl font-semibold text-blue-600">{analysis.display_name}</h2>
          <p className="text-gray-600 mt-2">ID: {analysis.id}</p>
          <p className="text-gray-600">Created: {new Date(analysis.created_at || '').toLocaleString()}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium text-gray-800 mb-2">Key Metrics</h3>
            <ul className="space-y-2">
              <li>Sentiment Score: {analysis.sentiment_score || 'N/A'}</li>
              <li>Review Count: {analysis.review_count || 'N/A'}</li>
              <li>Average Rating: {analysis.average_rating || 'N/A'}</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium text-gray-800 mb-2">Top Properties</h3>
            <ul className="space-y-2">
              {Object.keys(analysis).slice(0, 5).map(key => (
                <li key={key}>
                  <span className="font-mono text-xs">{key}:</span>{' '}
                  <span className="text-gray-600">
                    {typeof analysis[key as keyof Analysis] === 'object' 
                      ? 'Object' 
                      : String(analysis[key as keyof Analysis]).substring(0, 30)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('[AnalysisDebugView] Error:', error);
    return (
      <div className="p-8 bg-white rounded-lg shadow-lg max-w-4xl mx-auto mt-8 text-red-600">
        Error parsing analysis data: {String(error)}
      </div>
    );
  }
}
