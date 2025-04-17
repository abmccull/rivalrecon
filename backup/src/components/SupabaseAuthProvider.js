import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, User, Session, AuthResponse, AuthError } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required environment variables for Supabase configuration');
}

// Create a singleton supabase client
let supabaseInstance = null;
function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: 'rivalrecon-auth-token', // Unique storage key for this app
        persistSession: true
      }
    });
  }
  return supabaseInstance;
}

const supabase = getSupabaseClient();

// Type definitions removed for plain JavaScript compatibility

// Create context with default values
const SupabaseContext = createContext({
  supabase,
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => ({ data: { user: null, session: null }, error: null }),
  signUp: async () => ({ data: { user: null, session: null }, error: null }),
  signOut: async () => ({ error: null })
});

export const useSupabase = () => useContext(SupabaseContext);

export function SupabaseAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setIsLoading(false);
    });

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Auth methods
  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  };

  const signUp = async (email, password, metadata = {}) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
  };

  const signOut = async () => {
    return await supabase.auth.signOut();
  };

  const value = {
    supabase,
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
} 