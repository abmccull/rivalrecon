import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient, User, Session, AuthResponse, AuthError } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please ensure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

// Create a supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define the return types for auth methods
type SignInResponse = AuthResponse;
type SignUpResponse = AuthResponse;

// Define the context interface
interface SupabaseContextType {
  supabase: typeof supabase;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<SignInResponse>;
  signUp: (email: string, password: string, metadata?: object) => Promise<SignUpResponse>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

// Create context with default values
const SupabaseContext = createContext<SupabaseContextType>({
  supabase,
  user: null,
  session: null,
  isLoading: true,
  signIn: async (email, password) => ({ data: { user: null, session: null }, error: null }),
  signUp: async (email, password, metadata = {}) => ({ data: { user: null, session: null }, error: null }),
  signOut: async () => ({ error: null }),
});

export const useSupabase = () => useContext(SupabaseContext);

interface SupabaseAuthProviderProps {
  children: ReactNode;
}

export function SupabaseAuthProvider({ children }: SupabaseAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
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
  const signIn = async (email: string, password: string): Promise<SignInResponse> => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  };

  const signUp = async (email: string, password: string, metadata = {}): Promise<SignUpResponse> => {
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
