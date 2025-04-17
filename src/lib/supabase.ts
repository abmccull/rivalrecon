import { createClient } from '@supabase/supabase-js';

// Get environment variables with support for both React and Next.js formats
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single instance of the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Gets the current user session from Supabase
 * @returns The current session or null if not authenticated
 */
export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return data.session;
};

/**
 * Gets the current user from Supabase
 * @returns The current user or null if not authenticated
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
 * Sign in with email and password
 * @param email User's email
 * @param password User's password
 * @returns Session data or error
 */
export const signInWithEmail = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password
  });
};

/**
 * Sign up with email and password
 * @param email User's email
 * @param password User's password
 * @param metadata Optional metadata for the user
 * @returns User data or error
 */
export const signUpWithEmail = async (email: string, password: string, metadata = {}) => {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: metadata
    }
  });
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  return await supabase.auth.signOut();
};

// Debug logs
console.log('DEBUG - Supabase client utilities initialized'); 