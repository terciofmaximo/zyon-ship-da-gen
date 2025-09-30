-- Fix security warnings by adding search_path to functions
CREATE OR REPLACE FUNCTION public.create_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
  -- Create owner membership for the user who created the organization
  IF NEW.owner_user_id IS NOT NULL THEN
    INSERT INTO public.memberships (user_id, company_id, role)
    VALUES (NEW.owner_user_id, NEW.id, 'owner');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.normalize_invitation_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email = LOWER(NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;