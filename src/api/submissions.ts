import { SupabaseClient } from '@supabase/supabase-js';

export interface Submission {
  id: string;
  url: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  reviews?: Review[];
  analyses?: Analysis[];
}

export interface Review {
  id: string;
  submission_id: string;
  product_name: string;
  brand_name?: string;
  category?: string;
  overall_rating?: number;
  review_text?: string;
  review_date?: string;
  created_at: string;
}

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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const getSubmissions = async (supabase: SupabaseClient): Promise<Submission[]> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/submissions`, {
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch submissions');
  }

  const data = await response.json();
  
  // Handle both object with submissions property and direct array responses
  // This makes our code more robust to API changes
  if (Array.isArray(data)) {
    return data;
  } else if (data && data.submissions && Array.isArray(data.submissions)) {
    return data.submissions;
  } else {
    console.error('Unexpected response format:', data);
    return [];
  }
};

export const getSubmission = async (
  supabase: SupabaseClient,
  submissionId: string
): Promise<Submission> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/submissions/${submissionId}`, {
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch submission');
  }

  const data = await response.json();
  
  // Handle both object with submission property and direct object response
  if (data && data.submission) {
    return data.submission;
  } else if (data && data.id) {
    return data;
  } else {
    throw new Error('Invalid submission data received');
  }
};

export const submitUrl = async (
  url: string,
  supabase: SupabaseClient
): Promise<Submission> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/submissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit URL');
  }

  const data = await response.json();
  
  // Handle both object with submission property and direct object response
  if (data && data.submission) {
    return data.submission;
  } else if (data && data.id) {
    return data;
  } else {
    throw new Error('Invalid submission data received');
  }
}; 