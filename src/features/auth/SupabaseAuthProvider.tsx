import React, { createContext, useContext, useEffect, useState } from 'react';
import { SupabaseClient, User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

// Create context for Supabase auth
interface SupabaseAuthContextType {
  supabase: SupabaseClient;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
}

const SupabaseContext = createContext<SupabaseAuthContextType>({
  supabase,
  session: null,
  user: null,
  isLoading: true,
  signIn: async () => ({ error: new Error('Not implemented') }),
  signUp: async () => ({ error: new Error('Not implemented') }),
  signOut: async () => ({ error: new Error('Not implemented') }),
});

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

interface SupabaseAuthProviderProps {
  children: React.ReactNode;
}

export function SupabaseAuthProvider({ children }: SupabaseAuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    supabase,
    session,
    user,
    isLoading,
    signIn: async (email: string, password: string) => {
      console.log('SupabaseAuthProvider: signIn called', { email });
      try {
        console.log('SupabaseAuthProvider: calling supabase.auth.signInWithPassword');
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        console.log('SupabaseAuthProvider: signIn response', { data, error });
        return { error: error || null };
      } catch (error) {
        console.error('SupabaseAuthProvider: signIn error', error);
        return { error: error as Error };
      }
    },
    signUp: async (email: string, password: string) => {
      console.log('SupabaseAuthProvider: signUp called', { email });
      try {
        console.log('SupabaseAuthProvider: calling supabase.auth.signUp');
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        console.log('SupabaseAuthProvider: signUp response', { data, error });
        return { error: error || null };
      } catch (error) {
        console.error('SupabaseAuthProvider: signUp error', error);
        return { error: error as Error };
      }
    },
    signOut: async () => {
      console.log('SupabaseAuthProvider: signOut called');
      try {
        console.log('SupabaseAuthProvider: calling supabase.auth.signOut');
        const { error } = await supabase.auth.signOut();
        console.log('SupabaseAuthProvider: signOut response', { error });
        return { error: error || null };
      } catch (error) {
        console.error('SupabaseAuthProvider: signOut error', error);
        return { error: error as Error };
      }
    },
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
} 