import { supabase } from '../lib/supabase';

/**
 * Get the current authenticated user
 * @returns The authenticated user or null
 */
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return data.user;
};

/**
 * Check if the current user is authenticated
 * @returns True if authenticated, false otherwise
 */
export const isAuthenticated = async () => {
  const user = await getCurrentUser();
  return !!user;
};

/**
 * Check if the current user has access to a specific submission
 * @param submissionId The submission ID to check
 * @returns True if the user has access, false otherwise
 */
export const hasSubmissionAccess = async (submissionId: string) => {
  if (!await isAuthenticated()) {
    return false;
  }

  const { data, error } = await supabase
    .from('submissions')
    .select('id')
    .eq('id', submissionId)
    .limit(1)
    .single();

  if (error) {
    console.error('Error checking submission access:', error);
    return false;
  }

  return !!data;
};

/**
 * Get the user ID as a string
 * @returns The user ID or null if not authenticated
 */
export const getUserId = async () => {
  const user = await getCurrentUser();
  return user?.id || null;
};

/**
 * Update user profile data
 * @param profileData The profile data to update
 * @returns The updated user data or null if an error occurred
 */
export const updateUserProfile = async (profileData: Record<string, any>) => {
  const { data, error } = await supabase.auth.updateUser({
    data: profileData
  });

  if (error) {
    console.error('Error updating user profile:', error);
    return null;
  }

  return data.user;
}; 