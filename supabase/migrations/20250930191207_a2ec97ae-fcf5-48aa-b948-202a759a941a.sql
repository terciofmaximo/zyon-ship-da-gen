-- Fix search_path for extract_slug_from_domain function
CREATE OR REPLACE FUNCTION public.extract_slug_from_domain(p_domain TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_slug TEXT;
BEGIN
  -- Remove common TLDs and country codes
  v_slug := REGEXP_REPLACE(p_domain, '\.(com|net|org|edu|gov|mil|br|uk|de|fr|it|es|pt)(\.(br|uk|de|fr|it|es|pt))?$', '', 'i');
  
  -- Remove any remaining dots
  v_slug := REPLACE(v_slug, '.', '');
  
  -- Convert to lowercase and clean
  v_slug := LOWER(v_slug);
  v_slug := REGEXP_REPLACE(v_slug, '[^a-z0-9-]', '', 'g');
  
  RETURN v_slug;
END;
$$;