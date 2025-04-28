/**
 * Type definitions for analysis data in RivalRecon
 */

export interface Analysis {
  id: string;
  name: string;
  competitor?: string;
  url?: string;
  lastUpdated?: string;
  reviewsCount?: number;
  avgRating?: number;
  sentimentPositive?: number;
  sentimentNeutral?: number;
  sentimentNegative?: number;
  sentimentImprovement?: number;
  categoryRank?: number;
  totalInCategory?: number;
  keyInsights?: string[];
  keyThemes?: {
    text: string;
    count: number;
    sentiment: 'positive' | 'negative' | 'neutral';
  }[];
  improvementOpportunities?: string[];
  aiSummary?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface AnalysisListItem {
  id: string;
  name: string;
  competitor?: string;
  reviewsCount?: number;
  avgRating?: number;
  created_at?: string;
  updated_at?: string;
}
