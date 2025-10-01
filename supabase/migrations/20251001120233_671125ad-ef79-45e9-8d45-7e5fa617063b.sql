-- Create additional security definer function for session-based PDA lookups
-- This allows users to see PDAs they created in their browser session

CREATE OR REPLACE FUNCTION public.get_pdas_by_session(p_session_id text)
RETURNS SETOF public.pdas
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.pdas
  WHERE created_by_session_id = p_session_id
  ORDER BY created_at DESC;
$$;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_pdas_by_session(text) TO anon, authenticated;

-- Remove the session_id policy since we're using a function instead
DROP POLICY IF EXISTS "Creators can view their own PDAs" ON public.pdas;