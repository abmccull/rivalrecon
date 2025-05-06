/**
 * Type declarations for the Analysis module
 */

declare module '@/lib/analysis' {
  export interface Analysis {
    id: string;
    submission_id?: string;
    created_at?: string;
    
    // Analysis data
    ratings_over_time?: any;
    trending?: any;
    top_positives?: string[];
    top_negatives?: string[];
    word_map?: any;
    competitive_insights?: any;
    opportunities?: any;
    
    // Metadata
    product_name?: string;
    brand_name?: string;
    category?: string;
    overall_rating?: number;
    review_count?: number;
    
    // Status
    status?: 'pending' | 'processing' | 'completed' | 'failed';
  }
}
