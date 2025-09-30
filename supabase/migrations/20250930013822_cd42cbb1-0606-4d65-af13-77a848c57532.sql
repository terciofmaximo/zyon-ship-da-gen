-- Create memberships table
CREATE TYPE public.membership_role AS ENUM ('owner', 'admin', 'member', 'viewer');

CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role public.membership_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Create invitations table
CREATE TYPE public.invitation_role AS ENUM ('admin', 'member', 'viewer');
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.invitation_role NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  status public.invitation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add slug unique constraint to organizations if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS organizations_slug_unique ON public.organizations(slug);

-- Enable RLS on new tables
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for memberships
CREATE POLICY "Users can view memberships from their organizations"
ON public.memberships FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
  ) OR 
  has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Organization owners/admins can manage memberships"
ON public.memberships FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE user_id = auth.uid() 
    AND company_id = memberships.company_id 
    AND role IN ('owner', 'admin')
  ) OR
  has_role(auth.uid(), 'platformAdmin'::app_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE user_id = auth.uid() 
    AND company_id = memberships.company_id 
    AND role IN ('owner', 'admin')
  ) OR
  has_role(auth.uid(), 'platformAdmin'::app_role)
);

-- RLS policies for invitations
CREATE POLICY "Organization members can view invitations"
ON public.invitations FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Organization owners/admins can manage invitations"
ON public.invitations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE user_id = auth.uid() 
    AND company_id = invitations.company_id 
    AND role IN ('owner', 'admin')
  ) OR
  has_role(auth.uid(), 'platformAdmin'::app_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE user_id = auth.uid() 
    AND company_id = invitations.company_id 
    AND role IN ('owner', 'admin')
  ) OR
  has_role(auth.uid(), 'platformAdmin'::app_role)
);

-- Function to auto-create owner membership when company is created
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create owner membership
CREATE TRIGGER trigger_create_owner_membership
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.create_owner_membership();

-- Add updated_at trigger for memberships
CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed platformAdmin for specific user
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user ID for the email
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = 'contact@vesselopsportal.com';
  
  -- Insert platformAdmin role if user exists
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'platformAdmin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX idx_memberships_company_id ON public.memberships(company_id);
CREATE INDEX idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX idx_invitations_company_id ON public.invitations(company_id);
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_email ON public.invitations(email);

-- Function to normalize email to lowercase in invitations
CREATE OR REPLACE FUNCTION public.normalize_invitation_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email = LOWER(NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_normalize_invitation_email
  BEFORE INSERT OR UPDATE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_invitation_email();