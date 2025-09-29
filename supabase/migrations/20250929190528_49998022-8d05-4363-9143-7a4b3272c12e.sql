-- Create organization_domains table
CREATE TABLE public.organization_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_domains ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Org admins can view domains"
ON public.organization_domains
FOR SELECT
USING (
  is_org_admin(auth.uid(), org_id) 
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Org admins can create domains"
ON public.organization_domains
FOR INSERT
WITH CHECK (
  is_org_admin(auth.uid(), org_id) 
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Org admins can update domains"
ON public.organization_domains
FOR UPDATE
USING (
  is_org_admin(auth.uid(), org_id) 
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Org admins can delete domains"
ON public.organization_domains
FOR DELETE
USING (
  is_org_admin(auth.uid(), org_id) 
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

-- Create function to auto-join user to org by domain
CREATE OR REPLACE FUNCTION public.auto_join_by_domain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  user_domain TEXT;
  matching_org_id UUID;
  invite_role TEXT;
  final_role TEXT := 'ops';
BEGIN
  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
  
  IF user_email IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Extract domain from email
  user_domain := LOWER(SPLIT_PART(user_email, '@', 2));
  
  -- Check for pending invite first
  SELECT org_id, role INTO matching_org_id, invite_role
  FROM public.organization_invites
  WHERE LOWER(email) = LOWER(user_email)
    AND expires_at > now()
    AND accepted_at IS NULL
  LIMIT 1;
  
  -- If invite exists, use invite role
  IF matching_org_id IS NOT NULL THEN
    final_role := invite_role;
  ELSE
    -- Check for verified domain match
    SELECT org_id INTO matching_org_id
    FROM public.organization_domains
    WHERE domain = user_domain
      AND verified_at IS NOT NULL
    LIMIT 1;
  END IF;
  
  -- Auto-join if match found
  IF matching_org_id IS NOT NULL THEN
    INSERT INTO public.organization_members (org_id, user_id, role)
    VALUES (matching_org_id, NEW.id, final_role)
    ON CONFLICT (org_id, user_id) DO NOTHING;
    
    -- Mark invite as accepted if it was an invite
    IF invite_role IS NOT NULL THEN
      UPDATE public.organization_invites
      SET accepted_at = now()
      WHERE LOWER(email) = LOWER(user_email)
        AND org_id = matching_org_id
        AND accepted_at IS NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users insert
CREATE TRIGGER on_auth_user_auto_join
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_join_by_domain();

-- Add index for performance
CREATE INDEX idx_organization_domains_domain ON public.organization_domains(domain);
CREATE INDEX idx_organization_domains_org_id ON public.organization_domains(org_id);