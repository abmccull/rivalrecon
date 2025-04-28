"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faLock, 
  faEye, 
  faEyeSlash, 
  faChartLine, 
  faShieldHalved, 
  faCircleNotch 
} from '@fortawesome/free-solid-svg-icons';
import { faGoogle, faMicrosoft } from '@fortawesome/free-brands-svg-icons';
import { useAuth } from "@/components/layout/AuthProvider";

const schema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
  remember: z.boolean().optional(),
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

export default function SignInPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  // No redirect logic here; AuthProvider handles it globally.
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const { signIn } = useAuth();
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      remember: false
    }
  });

  const onSubmit = async (data: FormData) => {
    setError("");
    setAuthLoading(true);
    console.log("Starting sign in process...");
    
    try {
      // Use the AuthProvider's signIn method
      await signIn(data.email, data.password);
      
      // The sign-in was successful, log the redirect destination
      console.log("Sign in successful, redirecting to:", redirectTo);
      
      // Force a direct browser navigation - this ensures a full page refresh
      // that will properly synchronize the session state with the middleware
      window.location.href = redirectTo;
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(getFriendlyErrorMessage(err.message || "Failed to sign in"));
    } finally {
      setAuthLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div id="login-page" className="min-h-screen bg-[#F7FAFC] flex flex-col">
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div id="login-form-container" className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[#1F2937] mb-2">Welcome back</h1>
              <p className="text-gray-600">Sign in to access your RivalRecon dashboard</p>
            </div>
            
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-6">{error}</div>}
            
            <div id="social-login" className="space-y-3 mb-6">
              <button type="button" className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-md py-3 px-4 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                <FontAwesomeIcon icon={faGoogle} className="text-xl" />
                <span>Sign in with Google</span>
              </button>
              
              <button type="button" className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-md py-3 px-4 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                <FontAwesomeIcon icon={faMicrosoft} className="text-xl" />
                <span>Sign in with Microsoft</span>
              </button>
            </div>
            
            <div className="relative flex items-center my-6">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-600 text-sm">or sign in with email</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            
            <form id="login-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Work Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon icon={faEnvelope} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      placeholder="you@company.com"
                      className={`w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-[#2DD4BF]`}
                      {...register("email")}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email.message}</span>}
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                    <Link href="/forgot-password" className="text-sm text-[#2DD4BF] hover:underline cursor-pointer">Forgot password?</Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-10 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-[#2DD4BF]`}
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
                
                <div>
                  <button
                    type="submit"
                    disabled={authLoading}
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
              Don't have an account? 
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
              <p className="text-gray-500 text-sm">© {new Date().getFullYear()} RivalRecon. All rights reserved.</p>
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