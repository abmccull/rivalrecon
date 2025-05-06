"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { getRedirectURL } from "@/lib/auth-helpers";
import Link from "next/link";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faShieldHalved,
  faCircleNotch
} from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { useAuth } from "@/components/layout/AuthProvider";
import { createClient } from '@/lib/supabase/client';
import ReCaptcha from '@/components/auth/ReCaptcha';

const schema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
  remember: z.boolean().optional(),
  recaptchaToken: z.string().min(1, { message: "Please complete the reCAPTCHA verification" }),
});

type FormData = z.infer<typeof schema>;

function getFriendlyErrorMessage(errorMessage: string): string {
  if (errorMessage.includes("Invalid login credentials")) {
    return "Invalid email or password. Please try again.";
  }
  if (errorMessage.includes("rate limit")) {
    return "Too many attempts. Please try again later.";
  }
  return errorMessage;
}

// This component safely uses useSearchParams inside a Suspense boundary
function SignInForm() {
  // router is used for redirects after auth operations
  const router = useRouter(); 
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const { loading: authProviderLoading } = useAuth();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const { signIn } = useAuth();
  const supabase = createClient();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      remember: false
    }
  });
  
  // Update reCAPTCHA token in the form when it changes
  useEffect(() => {
    if (recaptchaToken) {
      setValue('recaptchaToken', recaptchaToken);
    }
  }, [recaptchaToken, setValue]);

  const onSubmit = async (data: FormData) => {
    setError("");
    setAuthLoading(true);
    console.log("Starting sign in process...");
    
    // Verify reCAPTCHA token is present
    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA verification");
      setAuthLoading(false);
      return;
    }
    
    try {
      await signIn(data.email, data.password, data.recaptchaToken);
      
      console.log("Sign in successful, redirecting to:", redirectTo);
      
      window.location.href = redirectTo;
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(getFriendlyErrorMessage(err.message || "Failed to sign in"));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Use the new helper function for proper redirect handling across environments
          redirectTo: getRedirectURL('/auth/callback'),
          // Include scopes for profile information
          scopes: 'email profile'
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Failed to initiate Google sign-in.');
      setGoogleLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (authProviderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FontAwesomeIcon icon={faCircleNotch} className="animate-spin text-4xl text-[#2DD4BF]" />
      </div>
    );
  }

  return (
    <div id="login-page" className="min-h-screen bg-[#F7FAFC] flex flex-col">
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800">Sign in to RivalRecon</h1>
            <p className="mt-2 text-gray-600">Track your competitors. Win your market.</p>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <div className="flex justify-center">
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading || authLoading}
              className="flex items-center justify-center w-full py-3 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2DD4BF] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <FontAwesomeIcon icon={faCircleNotch} className="animate-spin mr-2" />
              ) : (
                <FontAwesomeIcon icon={faGoogle} className="mr-2" />
              )}
              Sign in with Google
            </button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>
          
          <div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon icon={faEnvelope} className="text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#2DD4BF] focus:ring-[#2DD4BF] sm:text-sm"
                      placeholder="you@example.com"
                      {...register("email")}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email.message}</span>}
                </div>
                
                <div className="mb-6">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#2DD4BF] focus:ring-[#2DD4BF] sm:text-sm"
                      placeholder="••••••••"
                      {...register("password")}
                      autoComplete="current-password"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <FontAwesomeIcon 
                        icon={showPassword ? faEyeSlash : faEye} 
                        className="text-gray-400 cursor-pointer hover:text-gray-600"
                        onClick={togglePasswordVisibility}
                      />
                    </div>
                  </div>
                  {errors.password && <span className="text-red-500 text-xs mt-1">{errors.password.message}</span>}
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 text-[#2DD4BF] focus:ring-[#2DD4BF] border-gray-300 rounded"
                    {...register("remember")}
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                    Remember me for 30 days
                  </label>
                </div>
                
                {/* ReCAPTCHA Component */}
                <div className="my-4">
                  <ReCaptcha 
                    onChange={setRecaptchaToken}
                    onExpired={() => setRecaptchaToken(null)}
                    className="flex justify-center"
                  />
                  {errors.recaptchaToken && (
                    <p className="text-red-500 text-xs mt-1">{errors.recaptchaToken.message}</p>
                  )}
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={authLoading || googleLoading}
                    className="w-full bg-[#2DD4BF] text-white py-3 px-4 rounded-md font-medium hover:bg-opacity-90 transform hover:scale-[1.02] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2DD4BF] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {authLoading ? (
                      <>
                        <FontAwesomeIcon icon={faCircleNotch} className="animate-spin mr-2" />
                        Signing in...
                      </>
                    ) : "Sign in"}
                  </button>
                </div>
              </div>
            </form>
          </div>
          
          <div id="signup-option" className="text-center mt-6">
            <p className="text-gray-600">
              Don&apos;t have an account? 
              <Link href="/sign-up" className="text-[#2DD4BF] font-medium hover:underline cursor-pointer ml-1">
                Start your free trial
              </Link>
            </p>
          </div>
          
          <div id="security-info" className="flex items-center justify-center mt-8 text-gray-500 text-sm">
            <FontAwesomeIcon icon={faShieldHalved} className="mr-2" />
            <span>Secure, encrypted connection</span>
          </div>
        </div>
      </div>
      
      <footer id="footer" className="bg-white py-6 border-t border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-500 text-sm"> © {new Date().getFullYear()} RivalRecon. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <span className="text-gray-500 hover:text-[#2DD4BF] text-sm cursor-pointer">Terms of Service</span>
              <span className="text-gray-500 hover:text-[#2DD4BF] text-sm cursor-pointer">Privacy Policy</span>
              <span className="text-gray-500 hover:text-[#2DD4BF] text-sm cursor-pointer">Cookie Policy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// This is the main page component that wraps the form in a Suspense boundary
export default function SignInPage() {
  // authProviderLoading is used to show loading state while auth is initializing
  const { loading: authProviderLoading } = useAuth();
  
  if (authProviderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FontAwesomeIcon icon={faCircleNotch} className="animate-spin text-4xl text-[#2DD4BF]" />
      </div>
    );
  }
  
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <FontAwesomeIcon icon={faCircleNotch} className="animate-spin text-4xl text-[#2DD4BF]" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
