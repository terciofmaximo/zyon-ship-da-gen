-- Phase 1: Multi-tenant onboarding schema updates (corrected)

-- Add owner_user_id to organizations
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create user_profiles table to store additional user metadata
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  must_reset_password BOOLEAN DEFAULT false,
  invited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS user_profiles_select_own ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update_own ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_admin_all ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_org_admin ON public.user_profiles;

-- Users can view their own profile
CREATE POLICY user_profiles_select_own ON public.user_profiles
FOR SELECT
USING (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY user_profiles_update_own ON public.user_profiles
FOR UPDATE
USING (user_id = auth.uid());

-- platformAdmin can view all profiles
CREATE POLICY user_profiles_admin_all ON public.user_profiles
FOR ALL
USING (has_role(auth.uid(), 'platformAdmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'platformAdmin'::app_role));

-- Org admins can view profiles in their org
CREATE POLICY user_profiles_org_admin ON public.user_profiles
FOR SELECT
USING (
  tenant_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Update organization_invites
ALTER TABLE public.organization_invites
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS used_at TIMESTAMP WITH TIME ZONE;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_org_invites_token ON public.organization_invites(token);
CREATE INDEX IF NOT EXISTS idx_org_invites_email ON public.organization_invites(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_id ON public.user_profiles(tenant_id);

-- Function to get tenant by slug
CREATE OR REPLACE FUNCTION public.get_tenant_by_slug(tenant_slug TEXT)
RETURNS TABLE(id UUID, name TEXT, slug TEXT, owner_user_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, slug, owner_user_id
  FROM public.organizations
  WHERE slug = tenant_slug
  LIMIT 1;
$$;

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, must_reset_password)
  VALUES (NEW.id, false)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to auto-create user profile
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- Add trigger for user_profiles updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();