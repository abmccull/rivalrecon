-- Migration script for subscriptions table in Supabase
-- This ensures the table exists with all required columns for Stripe integration

-- Create subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "stripe_customer_id" TEXT,
  "stripe_subscription_id" TEXT UNIQUE,
  "status" TEXT NOT NULL,
  "price_id" TEXT,
  "plan_id" TEXT,
  "quantity" INTEGER DEFAULT 1,
  "cancel_at_period_end" BOOLEAN DEFAULT FALSE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "canceled_at" TIMESTAMP WITH TIME ZONE,
  "trial_start" TIMESTAMP WITH TIME ZONE,
  "trial_end" TIMESTAMP WITH TIME ZONE,
  "current_period_start" TIMESTAMP WITH TIME ZONE,
  "current_period_end" TIMESTAMP WITH TIME ZONE,
  "customer_email" TEXT,
  "customer_name" TEXT,
  "last_payment_date" TIMESTAMP WITH TIME ZONE,
  "last_invoice_id" TEXT,
  "payment_failure_count" INTEGER DEFAULT 0,
  "last_payment_error" TEXT,
  "last_payment_attempt" TIMESTAMP WITH TIME ZONE
);

-- Add comment to table
COMMENT ON TABLE "subscriptions" IS 'Stores subscription information from Stripe';

-- Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS "payments" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "stripe_customer_id" TEXT NOT NULL,
  "stripe_subscription_id" TEXT REFERENCES subscriptions(stripe_subscription_id),
  "stripe_invoice_id" TEXT UNIQUE,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "payment_date" TIMESTAMP WITH TIME ZONE NOT NULL,
  "payment_method" TEXT,
  "status" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE "payments" IS 'Stores payment history from Stripe';

-- Row level security
-- Enable RLS
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own subscriptions"
  ON "subscriptions"
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own payments"
  ON "payments"
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(stripe_customer_id);
