"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import ReCaptcha from "@/components/auth/ReCaptcha";
import Link from "next/link";

const schema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  recaptchaToken: z.string().min(1, { message: "Please complete the reCAPTCHA verification" }),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  
  // Update reCAPTCHA token in the form when it changes
  useEffect(() => {
    if (recaptchaToken) {
      setValue('recaptchaToken', recaptchaToken);
    }
  }, [recaptchaToken, setValue]);

  const onSubmit = async (data: FormData) => {
    setError("");
    const supabase = createClient();
    
    // Verify reCAPTCHA token is present
    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA verification");
      return;
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
        captchaToken: data.recaptchaToken,
      });
      
      if (error) {
        setError(error.message);
      } else {
        setIsEmailSent(true);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Reset Password</h1>
        
        {!isEmailSent ? (
          <>
            <p className="text-gray-600 text-center mb-6">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  {...register("email")}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoComplete="email"
                />
                {errors.email && (
                  <span className="text-red-500 text-xs mt-1">{errors.email.message}</span>
                )}
              </div>
              
              {/* ReCAPTCHA Component */}
              <div className="mb-4">
                <ReCaptcha 
                  onChange={setRecaptchaToken}
                  onExpired={() => setRecaptchaToken(null)}
                  className="flex justify-center"
                />
                {errors.recaptchaToken && (
                  <p className="mt-1 text-xs text-red-500">{errors.recaptchaToken.message}</p>
                )}
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm mb-6">
              Reset link sent! Please check your email.
            </div>
            <p className="text-gray-600 mb-4">
              If you don&apos;t see the email, check your spam folder or try again.
            </p>
          </div>
        )}
        
        <div className="text-center text-sm mt-4 text-gray-600">
          <Link href="/sign-in" className="text-blue-600 hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
} 