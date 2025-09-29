-- Fix infinite recursion in organization_members RLS policies
-- Drop the problematic view that causes recursion
DROP VIEW IF EXISTS public.user_org_memberships CASCADE;

-- Create a security definer function to get user's org IDs
-- This avoids recursion by bypassing RLS
CREATE OR REPLACE FUNCTION public.get_user_org_ids(_user_id uuid)
RETURNS TABLE(org_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT om.org_id
  FROM public.organization_members om
  WHERE om.user_id = _user_id;
$$;

-- Drop existing policies on organization_members
DROP POLICY IF EXISTS "Users can view members of their orgs" ON public.organization_members;
DROP POLICY IF EXISTS "Org owners/admins can manage members" ON public.organization_members;

-- Recreate policies using the security definer function
CREATE POLICY "Users can view org members"
ON public.organization_members
FOR SELECT
USING (
  -- Users can view members of orgs they belong to
  org_id IN (SELECT public.get_user_org_ids(auth.uid()))
  -- Or they're platformAdmin
  OR public.has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Org owners/admins can manage members"
ON public.organization_members
FOR ALL
USING (
  -- Only owners/admins of the org can manage members
  (
    org_id IN (
      SELECT om.org_id
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  )
  -- Or they're platformAdmin
  OR public.has_role(auth.uid(), 'platformAdmin'::app_role)
);