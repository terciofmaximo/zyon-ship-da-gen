-- Fix dangerous RLS policy on email_verifications table
-- The current "Service can manage verifications" policy allows ANY authenticated user
-- to read, create, update, and delete all verification tokens - this is a critical security flaw

-- Drop the overly permissive service policy
DROP POLICY IF EXISTS "Service can manage verifications" ON public.email_verifications;

-- Email verification should be handled by edge functions using the service role key
-- which bypasses RLS entirely, so we don't need this policy
-- 
-- If you need programmatic access to manage verifications, create an edge function
-- that uses the service role key - it will automatically bypass RLS

-- Keep the user policy for viewing their own verifications
-- (This policy already exists: "Users can view their own verifications")

-- Add policy to allow inserting verification records
-- Only the system (via edge functions with service role) should create these
-- but we need to allow inserts for the verification flow
CREATE POLICY "System can create verifications"
ON public.email_verifications
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Add policy to allow marking verifications as used
CREATE POLICY "Users can mark their verifications as used"
ON public.email_verifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND used_at IS NOT NULL);

-- Note: Deletion and unrestricted updates should only be done via edge functions
-- using the service role key, which bypasses RLS entirely