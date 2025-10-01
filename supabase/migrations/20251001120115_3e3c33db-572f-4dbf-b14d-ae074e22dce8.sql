-- Fix search_path security issues in existing functions
-- These functions were missing explicit search_path settings

-- Fix create_owner_membership function
CREATE OR REPLACE FUNCTION public.create_owner_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Create owner membership for the user who created the organization
  IF NEW.owner_user_id IS NOT NULL THEN
    INSERT INTO public.memberships (user_id, company_id, role)
    VALUES (NEW.owner_user_id, NEW.id, 'owner')
    ON CONFLICT (user_id, company_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix normalize_invitation_email function
CREATE OR REPLACE FUNCTION public.normalize_invitation_email()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.email = LOWER(NEW.email);
  RETURN NEW;
END;
$function$;