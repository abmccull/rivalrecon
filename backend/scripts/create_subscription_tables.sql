-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_id TEXT,
  status TEXT,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.subscriptions FOR SELECT 
USING (auth.uid() = user_id);

-- Only allow service role to insert/update subscriptions
CREATE POLICY "Only service role can insert subscriptions" 
ON public.subscriptions FOR INSERT 
TO service_role
USING (true);

CREATE POLICY "Only service role can update subscriptions" 
ON public.subscriptions FOR UPDATE 
TO service_role
USING (true);

-- Create usage_limits table to store the limits for each plan
CREATE TABLE IF NOT EXISTS public.usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id TEXT NOT NULL,
  monthly_submissions INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add initial plans
INSERT INTO public.usage_limits (plan_id, monthly_submissions)
VALUES 
  ('basic', 5),
  ('pro', 20),
  ('enterprise', 100)
ON CONFLICT (plan_id) DO UPDATE
SET monthly_submissions = EXCLUDED.monthly_submissions;

-- Create usage_tracking table for monitoring monthly usage
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
CREATE POLICY "Users can view their own usage" 
ON public.usage_tracking FOR SELECT 
USING (auth.uid() = user_id);

-- Only allow service role to insert/update usage
CREATE POLICY "Only service role can insert usage" 
ON public.usage_tracking FOR INSERT 
TO service_role
USING (true);

CREATE POLICY "Only service role can update usage" 
ON public.usage_tracking FOR UPDATE 
TO service_role
USING (true);
