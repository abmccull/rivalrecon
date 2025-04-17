import { SupabaseClient } from '@supabase/supabase-js';

export interface Analysis {
  id: string;
  submission_id: string;
  ratings_over_time?: any;
  trending?: string;
  top_positives?: any;
  top_negatives?: any;
  word_map?: any;
  competitive_insights?: any;
  opportunities?: any;
  created_at: string;
}

/**
 * Get analysis for a specific submission
 * Uses Supabase's built-in authentication and RLS policies
 */
export const getAnalysis = async (
  submissionId: string,
  supabaseClient: SupabaseClient
): Promise<Analysis | null> => {
  if (!submissionId || !supabaseClient) {
    console.error('Missing submission ID or Supabase client');
    return null;
  }

  try {
    const { data, error } = await supabaseClient
      .from('analyses')
      .select('*')
      .eq('submission_id', submissionId)
      .single();

    if (error) {
      console.error('Error fetching analysis:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Exception fetching analysis:', err);
    return null;
  }
};

/**
 * Get all analyses for a user's submissions
 * RLS will automatically filter to the current user's submissions
 */
export const getAnalyses = async (
  supabaseClient: SupabaseClient
): Promise<Analysis[]> => {
  if (!supabaseClient) {
    console.error('Missing Supabase client');
    return [];
  }

  try {
    // RLS will automatically filter to the current user
    const { data, error } = await supabaseClient
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching analyses:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Exception fetching analyses:', err);
    return [];
  }
}; 