"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import ReCaptcha from "@/components/auth/ReCaptcha";
import Link from "next/link";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faEyeSlash, 
  faChartLine, 
  faStar,
  faBottleWater,
  faCookieBite,
  faCircleNotch
} from '@fortawesome/free-solid-svg-icons';
import { 
  faGoogle, 
  faMicrosoft, 
  faAmazon
} from '@fortawesome/free-brands-svg-icons';

const schema = z.object({
  fullname: z.string().min(1, { message: "Full name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  company: z.string().min(1, { message: "Company name is required" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[0-9]/, { message: "Password must contain at least 1 number" })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least 1 special character" }),
  terms: z.boolean().refine(val => val === true, {
    message: "You must agree to the Terms of Service and Privacy Policy"
  }),
  recaptchaToken: z.string().min(1, { message: "Please complete the reCAPTCHA verification" })
});

type FormData = z.infer<typeof schema>;

function getFriendlyErrorMessage(errorMessage: string): string {
  if (errorMessage.includes("email already registered")) {
    return "This email is already registered. Please sign in instead.";
  }
  if (errorMessage.includes("rate limit")) {
    return "Too many attempts. Please try again later.";
  }
  return errorMessage;
}

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      terms: false
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
    
    // Verify reCAPTCHA token is present
    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA verification");
      setAuthLoading(false);
      return;
    }
    
    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          captchaToken: data.recaptchaToken,
          data: {
            full_name: data.fullname,
            company: data.company
          }
        }
      });
      if (signUpError) {
        setError(getFriendlyErrorMessage(signUpError.message));
        setAuthLoading(false);
        return;
      }
      setSuccess(true);
      // Optionally redirect to sign-in after a delay
      setTimeout(() => router.push('/sign-in'), 2000);
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Sign up error:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <section id="signup" className="bg-[#F7FAFC] min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <span className="text-[#1E3A8A] font-bold text-2xl">RivalRecon</span>
            <FontAwesomeIcon icon={faChartLine} className="text-[#2DD4BF] ml-1" />
          </div>
          <div className="mb-8 mt-4 text-center">
            <h1 className="text-2xl font-bold text-[#1F2937] mb-2">Create your account</h1>
            <p className="text-gray-600">Start your 3-day free trial.</p>
          </div>
        </div>
        
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-6">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm mb-6">Account created! Please check your email for confirmation. Redirecting to sign in...</div>}
        
        <form id="signup-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                id="fullname" 
                type="text" 
                className={`w-full px-4 py-3 border ${errors.fullname ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-[#2DD4BF] focus:border-[#2DD4BF] outline-none`} 
                placeholder="John Smith"
                {...register("fullname")}
              />
              {errors.fullname && <p className="mt-1 text-xs text-red-500">{errors.fullname.message}</p>}
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Work Email</label>
              <input 
                id="email" 
                type="email" 
                className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-[#2DD4BF] focus:border-[#2DD4BF] outline-none`} 
                placeholder="john@company.com"
                {...register("email")}
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
            
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input 
                id="company" 
                type="text" 
                className={`w-full px-4 py-3 border ${errors.company ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-[#2DD4BF] focus:border-[#2DD4BF] outline-none`} 
                placeholder="Your Company"
                {...register("company")}
              />
              {errors.company && <p className="mt-1 text-xs text-red-500">{errors.company.message}</p>}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  className={`w-full px-4 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-[#2DD4BF] focus:border-[#2DD4BF] outline-none`} 
                  placeholder="••••••••"
                  {...register("password")}
                  autoComplete="new-password"
                />
                <button 
                  type="button" 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={togglePasswordVisibility}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters with 1 number and 1 special character</p>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input 
                id="terms" 
                type="checkbox" 
                className={`h-4 w-4 text-[#2DD4BF] focus:ring-[#2DD4BF] border-gray-300 rounded ${errors.terms ? 'border-red-500' : ''}`}
                {...register("terms")}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="terms" className={`${errors.terms ? 'text-red-500' : 'text-gray-600'}`}>
                I agree to the <span className="text-[#2DD4BF] hover:underline cursor-pointer">Terms of Service</span> and <span className="text-[#2DD4BF] hover:underline cursor-pointer">Privacy Policy</span>
              </label>
              {errors.terms && <p className="mt-1 text-xs text-red-500">{errors.terms.message}</p>}
            </div>
          </div>
          
          {/* ReCAPTCHA Component */}
          <div className="my-4">
            <ReCaptcha 
              onChange={setRecaptchaToken}
              onExpired={() => setRecaptchaToken(null)}
              className="flex justify-center"
            />
            {errors.recaptchaToken && (
              <p className="mt-1 text-xs text-red-500">{errors.recaptchaToken.message}</p>
            )}
          </div>
          
          <div>
            <button 
              type="submit" 
              id="signup-button" 
              disabled={authLoading}
              className="w-full bg-[#2DD4BF] text-white py-3 px-4 rounded-md font-medium hover:bg-opacity-90 transform hover:scale-[1.02] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2DD4BF] flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {authLoading ? (
                <>
                  <FontAwesomeIcon icon={faCircleNotch} className="animate-spin mr-2" />
                  Creating Account...
                </>
              ) : 'Create Account'}
            </button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or sign up with</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              <FontAwesomeIcon icon={faGoogle} className="text-lg mr-2" />
              Google
            </button>
            <button type="button" className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              <FontAwesomeIcon icon={faMicrosoft} className="text-lg mr-2" />
              Microsoft
            </button>
          </div>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already have an account? 
            <Link href="/sign-in" className="text-[#2DD4BF] font-medium hover:underline cursor-pointer ml-1">
              Log in
            </Link>
          </p>
        </div>
      </div>
      
      <div className="mt-8 text-center max-w-md">
        <div className="flex items-center justify-center mb-4">
          <div className="flex text-[#2DD4BF]">
            <FontAwesomeIcon icon={faStar} />
            <FontAwesomeIcon icon={faStar} />
            <FontAwesomeIcon icon={faStar} />
            <FontAwesomeIcon icon={faStar} />
            <FontAwesomeIcon icon={faStar} />
          </div>
          <span className="ml-2 text-gray-600 font-medium">Rated 4.9/5 from over 600 reviews</span>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          <div className="grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100">
            <FontAwesomeIcon icon={faAmazon} className="text-2xl text-gray-700" />
          </div>
          <div className="grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100">
            <FontAwesomeIcon icon={faBottleWater} className="text-2xl text-gray-700" />
          </div>
          <div className="grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100">
            <FontAwesomeIcon icon={faCookieBite} className="text-2xl text-gray-700" />
          </div>
        </div>
      </div>
    </section>
  );
} 