"use client";
import { ReactNode, createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { syncUserProfile } from '@/lib/auth/profile';
import { useRouter, usePathname } from 'next/navigation';
import { logger } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string, recaptchaToken?: string) => Promise<void>;
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

    setUser(newUser);
    
    // If we have a user, make sure their profile is synced
    if (newUser) {
      try {
        await syncUserProfile(newUser);
      } catch (error) {
        logger.error("Error syncing user profile:", error);
      }
    }
  }, []);

  // Check session on load
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error("Error getting session:", error);
          setUser(null);
          setLoading(false);
          return;
        }
        
        if (data?.session?.user) {
          await handleUserUpdate(data.session.user);
          
          // Define subscription-required pages vs. auth-only pages
          const subscriptionRequiredPages = ['/dashboard', '/analysis', '/competitors'];
          const authRequiredPages = [...subscriptionRequiredPages, '/settings', '/teams'];
          
          // Check if current page requires subscription
          const requiresSubscription = subscriptionRequiredPages.some(route => 
            pathname === route || pathname.startsWith(`${route}/`)
          );
          
          // Check if current page requires authentication
          const requiresAuth = authRequiredPages.some(route => 
            pathname === route || pathname.startsWith(`${route}/`)
          );
          
          if (requiresSubscription) {
            // Check if user has an active subscription
            try {
              const { data: subscription, error: subError } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', data.session.user.id)
                .single();
              
              if (subError || !subscription) {
                logger.log('No subscription found, redirecting to pricing');
                router.push('/pricing');
                return;
              }
            } catch (subCheckError) {
              logger.error('Error checking subscription:', subCheckError);
              router.push('/pricing');
              return;
            }
          } else if (requiresAuth) {
            // Page requires auth but not subscription, so we're good
            // Auth check successful - removed debug logging
          }
        } else {
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
        logger.error('AuthProvider: Error checking session', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    getSession();

    // Listen for auth state changes
    try {

      const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {

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

        listener?.subscription.unsubscribe();
      };
    } catch (error) {
      logger.error("Error setting up auth listener:", error);
      return () => {};
    }
  }, [handleUserUpdate, supabase, router, pathname]);

  // Sign in with email/password and reCAPTCHA verification
  const signIn = useCallback(async (email: string, password: string, recaptchaToken?: string) => {
    setLoading(true);
    try {
      // Create auth options with optional reCAPTCHA token
      const options: any = {};
      
      // Add captcha token if provided
      if (recaptchaToken) {
        options.captchaToken = recaptchaToken;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
        options
      });
      
      if (error) {
        logger.error("Error signing in:", error);
        setLoading(false);
        throw error;
      }
      
      if (data.session?.user) {

        await handleUserUpdate(data.session.user);
        // No longer handling redirect here since the sign-in page does it
      } else {
        logger.warn("Sign in returned no session.");
        throw new Error("No session returned from sign in");
      }
    } catch (error) {
      logger.error("Sign in failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [supabase, handleUserUpdate]);

  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      // Log the sign out attempt
      logger.debug(`Attempting to sign out user`);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error("Error signing out:", error);
      } else {
        logger.log("User signed out successfully");
        
        // Clear user state
        setUser(null);
        
        // Force a hard navigation to the sign-in page
        // This is more reliable than router.push for auth state changes
        window.location.href = '/sign-in';
      }
    } catch (error) {
      console.error("Error during sign out:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
} 