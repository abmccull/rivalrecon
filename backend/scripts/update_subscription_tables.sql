-- Add column for stripe_price_id if it doesn't exist yet
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Add column for submission_counter if it doesn't exist yet
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS submission_counter INTEGER DEFAULT 0;

-- Create usage_tracking table for monthly tracking if it doesn't exist
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  month TEXT NOT NULL,
  submissions_used INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Add RLS policies for usage_tracking
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own usage
CREATE POLICY IF NOT EXISTS "Users can view their own usage" 
ON public.usage_tracking FOR SELECT 
USING (auth.uid() = user_id);

-- Only allow service role to insert/update usage
CREATE POLICY IF NOT EXISTS "Only service role can insert usage" 
ON public.usage_tracking FOR INSERT 
TO service_role
USING (true);

CREATE POLICY IF NOT EXISTS "Only service role can update usage" 
ON public.usage_tracking FOR UPDATE 
TO service_role
USING (true);
