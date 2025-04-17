import { getSupabaseClient } from '../lib/supabase';

export interface Submission {
  id: number;
  created_at: string;
  url: string;
  status: 'pending' | 'completed' | 'failed';
  user_id: string;
  result_id?: number;
}

export interface SubmissionResponse {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  user_id: string;
}

export const submitUrl = async (url: string, userId: string): Promise<Submission | null> => {
  console.log('DEBUG - submitUrl called with:', { url, userId });
  
  if (!url || !userId) {
    console.error('DEBUG - submitUrl error: Missing URL or userId', { url, userId });
    throw new Error('URL and userId are required to submit a URL');
  }

  try {
    const supabase = await getSupabaseClient();
    
    console.log('DEBUG - Supabase client obtained, preparing to insert');
    
    // Log the submission data we're about to insert
    const submissionData = {
      url,
      status: 'pending' as const,
      user_id: userId,
    };
    
    console.log('DEBUG - Submission data:', submissionData);
    
    // Check if there are existing submissions with this URL and user_id
    const { data: existingSubmissions, error: checkError } = await supabase
      .from('submissions')
      .select('*')
      .eq('url', url)
      .eq('user_id', userId);
      
    if (checkError) {
      console.error('DEBUG - Error checking existing submissions:', checkError);
    } else {
      console.log('DEBUG - Existing submissions check:', { 
        exists: existingSubmissions?.length > 0,
        count: existingSubmissions?.length || 0
      });
    }
    
    // Perform the insert operation
    console.log('DEBUG - Executing insert operation');
    const { data, error } = await supabase
      .from('submissions')
      .insert(submissionData)
      .select()
      .single();

    if (error) {
      console.error('DEBUG - Submission insert error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    console.log('DEBUG - Submission successful, returned data:', data);
    return data;
  } catch (error: any) {
    console.error('DEBUG - Submission caught exception:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

export const getUserSubmissions = async (userId: string): Promise<Submission[]> => {
  console.log('DEBUG - getUserSubmissions called with userId:', userId);
  
  if (!userId) {
    console.error('DEBUG - getUserSubmissions error: Missing userId');
    return [];
  }

  try {
    const supabase = await getSupabaseClient();
    
    console.log('DEBUG - Fetching submissions for user');
    
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('DEBUG - getUserSubmissions error:', error);
      return [];
    }

    console.log('DEBUG - Retrieved submissions count:', data?.length || 0);
    return data || [];
  } catch (error: any) {
    console.error('DEBUG - getUserSubmissions caught exception:', error.message);
    return [];
  }
};

/**
 * Get a specific submission by ID
 * @param id The submission ID
 * @param userId The current user's ID from Clerk
 */
export async function getSubmission(id: string, userId: string): Promise<SubmissionResponse> {
  try {
    if (!userId) {
      throw new Error('User not authenticated. Please sign in to view submissions.');
    }
    
    // Get the Supabase client - no JWT token needed
    const supabase = await getSupabaseClient();
    
    // Query submissions table with explicit user_id filter
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId) // Filter by the provided user ID
      .single();
    
    if (error) {
      console.error(`Error fetching submission ${id}:`, error);
      throw new Error(error.message);
    }
    
    return data as SubmissionResponse;
  } catch (error: any) {
    console.error(`Error in getSubmission for ID ${id}:`, error);
    throw new Error(error.message || 'Failed to get submission');
  }
}

// Export alias to match expected function name in dashboard
export const getSubmissions = getUserSubmissions; 