"use client";
import { ReactNode, createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { syncUserProfile } from '@/lib/auth/profile';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  signIn: async () => {},
  signOut: async () => {},
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  // Handle the user updates and profile sync
  const handleUserUpdate = useCallback(async (newUser: User | null) => {
    console.log("Auth state changed, user:", newUser ? "logged in" : "logged out");
    setUser(newUser);
    
    // If we have a user, make sure their profile is synced
    if (newUser) {
      try {
        await syncUserProfile(newUser);
      } catch (error) {
        console.error("Error syncing user profile:", error);
      }
    }
  }, []);

  // Check session on load
  useEffect(() => {
    const getSession = async () => {
      try {
        console.log("Checking for existing session...");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          setUser(null);
          setLoading(false);
          return;
        }
        
        if (data?.session?.user) {
          console.log("Found existing session");
          await handleUserUpdate(data.session.user);
          // Do not redirect here; let the sign-in page handle navigation after login
        } else {
          console.log("No session found");
          setUser(null);
          
          // If on a protected page without a valid session, redirect to sign-in
          const protectedPages = ['/dashboard', '/settings', '/analysis', '/competitors', '/teams'];
          const isProtectedPage = protectedPages.some(route => 
            pathname === route || pathname.startsWith(`${route}/`)
          );
          
          if (isProtectedPage) {
            router.push(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
            router.refresh();
          }
        }
      } catch (error) {
        console.error("Unexpected error getting session:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    getSession();

    // Listen for auth state changes
    try {
      console.log("Setting up auth state change listener");
      const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth state change event:", event);
        const newUser = session?.user ?? null;
        await handleUserUpdate(newUser);
        
        // Force refresh UI after auth changes
        if (event === 'SIGNED_IN') {
          router.refresh(); // UI update only, do not force navigation
        } else if (event === 'SIGNED_OUT') {
          router.refresh();
          router.push('/sign-in');
        }
      });

      return () => {
        console.log("Cleaning up auth listener");
        listener?.subscription.unsubscribe();
      };
    } catch (error) {
      console.error("Error setting up auth listener:", error);
      return () => {};
    }
  }, [handleUserUpdate, supabase, router, pathname]);

  // Sign in with email/password
  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log("Attempting sign in for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("Error signing in:", error);
        setLoading(false);
        throw error;
      }
      
      if (data.session?.user) {
        console.log("Sign in successful");
        await handleUserUpdate(data.session.user);
        // No longer handling redirect here since the sign-in page does it
      } else {
        console.warn("Sign in returned no session.");
        throw new Error("No session returned from sign in");
      }
    } catch (error) {
      console.error("Sign in failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [supabase, handleUserUpdate]);

  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      console.log("Signing out...");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
      } else {
        console.log("Sign out successful");
        setUser(null);
        router.push('/sign-in');
        router.refresh();
      }
    } catch (error) {
      console.error("Error during sign out:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
} 