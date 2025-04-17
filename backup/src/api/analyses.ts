import { getSupabaseClient } from '../lib/supabase';

export interface Analysis {
  id: string;
  submission_id: string;
  ratings_over_time?: any;
  trending?: any;
  top_positives?: any;
  top_negatives?: any;
  word_map?: any;
  competitive_insights?: any;
  opportunities?: any;
  created_at: string;
}

/**
 * Get analyses for a user's submissions
 * @param userId The current user's ID from Clerk
 */
export async function getAnalyses(userId: string): Promise<Analysis[]> {
  try {
    if (!userId) {
      throw new Error('User not authenticated. Please sign in to view analyses.');
    }
    
    // Get Supabase client
    const supabase = await getSupabaseClient();
    
    // Query analyses table with a join to get only analyses for this user's submissions
    const { data, error } = await supabase
      .from('analyses')
      .select(`
        *,
        submissions!inner(user_id)
      `)
      .eq('submissions.user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching analyses:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  } catch (error: any) {
    console.error('Error in getAnalyses:', error);
    return [];
  }
}

/**
 * Get a specific analysis by submission ID
 * @param submissionId The ID of the submission to get analysis for
 * @param userId The current user's ID from Clerk
 */
export async function getAnalysis(submissionId: string, userId: string): Promise<Analysis | null> {
  try {
    if (!userId) {
      throw new Error('User not authenticated. Please sign in to view analyses.');
    }
    
    // Get Supabase client
    const supabase = await getSupabaseClient();
    
    // Query analyses table with a join to verify ownership
    const { data, error } = await supabase
      .from('analyses')
      .select(`
        *,
        submissions!inner(user_id)
      `)
      .eq('submission_id', submissionId)
      .eq('submissions.user_id', userId) // Verify the submission belongs to this user
      .maybeSingle(); // Returns null if not found
    
    if (error) {
      console.error(`Error fetching analysis for submission ${submissionId}:`, error);
      throw new Error(error.message);
    }
    
    return data as Analysis | null;
  } catch (error: any) {
    console.error(`Error in getAnalysis for submission ${submissionId}:`, error);
    throw new Error(error.message || 'Failed to get analysis');
  }
} 