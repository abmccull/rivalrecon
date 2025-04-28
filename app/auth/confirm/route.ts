import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/' // Default redirect path if not specified

  if (token_hash && type) {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      // Redirect to the specified page (e.g., /update-password)
      // The user is now temporarily authenticated to update their password
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Redirect the user to an error page if verification fails
  // TODO: Create a more specific error page
  console.error('OTP Verification Error:', searchParams.toString()); // Log error details
  return NextResponse.redirect(new URL('/error', request.url)) // Redirect to a generic error page
} 