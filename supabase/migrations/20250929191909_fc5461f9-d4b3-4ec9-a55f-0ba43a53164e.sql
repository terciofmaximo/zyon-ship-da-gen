-- Remove the overly permissive policy that allows anyone to view all invites
DROP POLICY IF EXISTS "Anyone can view invite by token" ON public.organization_invites;

-- Create a secure function to get an invite by token
-- This function uses SECURITY DEFINER to bypass RLS and only returns
-- the specific invite matching the provided token
CREATE OR REPLACE FUNCTION public.get_invite_by_token(invite_token text)
RETURNS TABLE (
  id uuid,
  org_id uuid,
  email text,
  role text,
  token text,
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz,
  created_by uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    org_id,
    email,
    role,
    token,
    expires_at,
    accepted_at,
    created_at,
    created_by
  FROM public.organization_invites
  WHERE token = invite_token
  LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(text) TO authenticated;

-- Also grant to anon users since they need to view invite before signing in
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(text) TO anon;