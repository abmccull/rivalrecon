-- Create the trial_history table to track trial usage
CREATE TABLE IF NOT EXISTS trial_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  trial_ended_at TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'canceled', 'upgraded'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Add unique constraint to ensure users can only have one record
  CONSTRAINT unique_user_trial UNIQUE (user_id)
);

-- Add RLS policies
ALTER TABLE trial_history ENABLE ROW LEVEL SECURITY;

-- Users can only read their own trial history
CREATE POLICY "Users can view their own trial history" 
  ON trial_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Only the service role can insert/update/delete
CREATE POLICY "Only service role can insert trial history" 
  ON trial_history 
  FOR INSERT 
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Only service role can update trial history" 
  ON trial_history 
  FOR UPDATE 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create a function to check if a user is eligible for a trial
CREATE OR REPLACE FUNCTION is_eligible_for_trial(user_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM trial_history WHERE trial_history.user_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
