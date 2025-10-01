-- Fix overly permissive RLS policy on pdas table
-- The current policy allows anyone to view ALL PDAs with a tracking_id
-- This exposes sensitive business data including client names, financial data, etc.

-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Public can view PDAs by tracking_id" ON public.pdas;

-- Create separate, more restrictive policies for different access patterns

-- 1. Authenticated org members can view their organization's PDAs
CREATE POLICY "Org members can view org PDAs"
ON public.pdas
FOR SELECT
TO authenticated
USING (
  (tenant_id IN (SELECT get_user_org_ids(auth.uid()))) 
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

-- 2. Create a security definer function for public lookup by exact tracking_id
-- This prevents listing all PDAs while allowing specific lookups
CREATE OR REPLACE FUNCTION public.get_pda_by_tracking_id(p_tracking_id text)
RETURNS SETOF public.pdas
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.pdas
  WHERE tracking_id = p_tracking_id
  LIMIT 1;
$$;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_pda_by_tracking_id(text) TO anon, authenticated;

-- 3. Keep the public insert policy (allows PDA creation without auth)
-- This is already in place: "Anyone can create PDAs"

-- 4. Add policy to allow creators to view their own PDAs via session_id
-- This allows users who created PDAs to see them before signup
CREATE POLICY "Creators can view their own PDAs"
ON public.pdas
FOR SELECT
TO anon, authenticated
USING (
  created_by_session_id IS NOT NULL 
  AND created_by_session_id = current_setting('app.session_id', true)
);

-- Note: The frontend will need to set the session_id in the request headers
-- or we'll create a separate function for this lookup as well