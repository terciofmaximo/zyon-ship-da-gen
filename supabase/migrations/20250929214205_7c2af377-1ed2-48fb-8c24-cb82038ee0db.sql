-- Drop and recreate the get_invite_by_token function with better security
DROP FUNCTION IF EXISTS public.get_invite_by_token(text);

-- Create a more secure version that validates the token but limits exposed data
CREATE OR REPLACE FUNCTION public.validate_invite_token(invite_token text)
RETURNS TABLE(
  id uuid,
  org_id uuid,
  email text,
  role text,
  expires_at timestamp with time zone,
  accepted_at timestamp with time zone,
  org_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- Fetch the invite
  SELECT 
    oi.id,
    oi.org_id,
    oi.email,
    oi.role,
    oi.expires_at,
    oi.accepted_at,
    o.name as org_name
  INTO invite_record
  FROM public.organization_invites oi
  JOIN public.organizations o ON o.id = oi.org_id
  WHERE oi.token = invite_token
  LIMIT 1;
  
  -- Return nothing if invite doesn't exist
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Return nothing if invite is expired
  IF invite_record.expires_at < now() THEN
    RETURN;
  END IF;
  
  -- Return nothing if invite was already accepted
  IF invite_record.accepted_at IS NOT NULL THEN
    RETURN;
  END IF;
  
  -- Return the invite data only if all checks pass
  RETURN QUERY SELECT 
    invite_record.id,
    invite_record.org_id,
    invite_record.email,
    invite_record.role,
    invite_record.expires_at,
    invite_record.accepted_at,
    invite_record.org_name;
END;
$$;

-- Grant execute permission to authenticated and anon users (needed for invite acceptance)
GRANT EXECUTE ON FUNCTION public.validate_invite_token(text) TO authenticated, anon;

-- Add comment explaining the security considerations
COMMENT ON FUNCTION public.validate_invite_token IS 'Validates an invitation token and returns invite details only if the token is valid, not expired, and not already accepted. This prevents email harvesting by requiring a valid, unexpired, unused token.';