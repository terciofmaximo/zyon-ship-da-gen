-- Fix dangerous RLS policy on email_verifications table
-- The current "Service can manage verifications" policy allows ANY authenticated user
-- to read, create, update, and delete all verification tokens - this is a critical security flaw

-- Drop the overly permissive service policy
DROP POLICY IF EXISTS "Service can manage verifications" ON public.email_verifications;

-- Email verification should be handled by edge functions using the service role key
-- which bypasses RLS entirely, so we don't need this overly permissive policy

-- The existing policy "Users can view their own verifications" is sufficient for users
-- to check their verification status

-- If you need programmatic access to manage verifications, create an edge function
-- that uses the service role key - it will automatically bypass RLS and have full access