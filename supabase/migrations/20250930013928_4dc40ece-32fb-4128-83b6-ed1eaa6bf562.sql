-- Create memberships table (only if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_type WHERE typname = 'membership_role') THEN
    CREATE TYPE public.membership_role AS ENUM ('owner', 'admin', 'member', 'viewer');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role public.membership_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Create invitations table (only if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_type WHERE typname = 'invitation_role') THEN
    CREATE TYPE public.invitation_role AS ENUM ('admin', 'member', 'viewer');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_type WHERE typname = 'invitation_status') THEN
    CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.invitation_role NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  status public.invitation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for memberships
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can view memberships from their organizations' 
    AND tablename = 'memberships'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view memberships from their organizations"
    ON public.memberships FOR SELECT
    TO authenticated
    USING (
      company_id IN (
        SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
      ) OR 
      has_role(auth.uid(), ''platformAdmin''::app_role)
    )';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Organization owners/admins can manage memberships' 
    AND tablename = 'memberships'
  ) THEN
    EXECUTE 'CREATE POLICY "Organization owners/admins can manage memberships"
    ON public.memberships FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.memberships 
        WHERE user_id = auth.uid() 
        AND company_id = memberships.company_id 
        AND role IN (''owner'', ''admin'')
      ) OR
      has_role(auth.uid(), ''platformAdmin''::app_role)
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.memberships 
        WHERE user_id = auth.uid() 
        AND company_id = memberships.company_id 
        AND role IN (''owner'', ''admin'')
      ) OR
      has_role(auth.uid(), ''platformAdmin''::app_role)
    )';
  END IF;
END $$;

-- RLS policies for invitations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Organization members can view invitations' 
    AND tablename = 'invitations'
  ) THEN
    EXECUTE 'CREATE POLICY "Organization members can view invitations"
    ON public.invitations FOR SELECT
    TO authenticated
    USING (
      company_id IN (
        SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
      ) OR
      has_role(auth.uid(), ''platformAdmin''::app_role)
    )';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Organization owners/admins can manage invitations' 
    AND tablename = 'invitations'
  ) THEN
    EXECUTE 'CREATE POLICY "Organization owners/admins can manage invitations"
    ON public.invitations FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.memberships 
        WHERE user_id = auth.uid() 
        AND company_id = invitations.company_id 
        AND role IN (''owner'', ''admin'')
      ) OR
      has_role(auth.uid(), ''platformAdmin''::app_role)
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.memberships 
        WHERE user_id = auth.uid() 
        AND company_id = invitations.company_id 
        AND role IN (''owner'', ''admin'')
      ) OR
      has_role(auth.uid(), ''platformAdmin''::app_role)
    )';
  END IF;
END $$;

-- Function to auto-create owner membership when company is created
CREATE OR REPLACE FUNCTION public.create_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
  -- Create owner membership for the user who created the organization
  IF NEW.owner_user_id IS NOT NULL THEN
    INSERT INTO public.memberships (user_id, company_id, role)
    VALUES (NEW.owner_user_id, NEW.id, 'owner')
    ON CONFLICT (user_id, company_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_create_owner_membership ON public.organizations;
CREATE TRIGGER trigger_create_owner_membership
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.create_owner_membership();

-- Add updated_at trigger for memberships
DROP TRIGGER IF EXISTS update_memberships_updated_at ON public.memberships;
CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance (only if not exists)
CREATE INDEX IF NOT EXISTS idx_memberships_company_id ON public.memberships(company_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_company_id ON public.invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);

-- Function to normalize email to lowercase in invitations
CREATE OR REPLACE FUNCTION public.normalize_invitation_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email = LOWER(NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_normalize_invitation_email ON public.invitations;
CREATE TRIGGER trigger_normalize_invitation_email
  BEFORE INSERT OR UPDATE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_invitation_email();

-- Seed platformAdmin role for specific user (using existing user_roles system)
-- First, find the user ID for contact@vesselopsportal.com
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = 'contact@vesselopsportal.com';
  
  IF target_user_id IS NOT NULL THEN
    -- Add platformAdmin role (ON CONFLICT DO NOTHING to avoid errors)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'platformAdmin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'PlatformAdmin role assigned to user: %', target_user_id;
  ELSE
    RAISE NOTICE 'User with email contact@vesselopsportal.com not found';
  END IF;
END $$;