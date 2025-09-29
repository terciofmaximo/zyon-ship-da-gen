-- Add primary_domain field to organizations
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS primary_domain TEXT;

-- Create unique index on primary_domain
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_primary_domain 
ON public.organizations(primary_domain) 
WHERE primary_domain IS NOT NULL;

-- Create platform_settings table for global configuration
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only platform admins can manage settings
CREATE POLICY "Platform admins can manage settings"
ON public.platform_settings
FOR ALL
USING (has_role(auth.uid(), 'platformAdmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'platformAdmin'::app_role));

-- Insert default platform settings
INSERT INTO public.platform_settings (key, value, description)
VALUES 
  ('base_domain', 'vesselopsportal.com', 'Base domain for tenant subdomains'),
  ('subdomain_prefix', 'erp-', 'Prefix for tenant subdomains')
ON CONFLICT (key) DO NOTHING;

-- Function to get tenant by hostname
CREATE OR REPLACE FUNCTION public.get_tenant_by_hostname(hostname TEXT)
RETURNS TABLE(id UUID, name TEXT, slug TEXT, owner_user_id UUID, primary_domain TEXT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.name, o.slug, o.owner_user_id, o.primary_domain
  FROM public.organizations o
  WHERE o.primary_domain = hostname
  LIMIT 1;
END;
$$;

-- Function to generate primary domain for an organization
CREATE OR REPLACE FUNCTION public.generate_primary_domain(org_slug TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_domain TEXT;
  subdomain_prefix TEXT;
BEGIN
  -- Get settings
  SELECT value INTO base_domain FROM public.platform_settings WHERE key = 'base_domain';
  SELECT value INTO subdomain_prefix FROM public.platform_settings WHERE key = 'subdomain_prefix';
  
  -- Return generated domain
  RETURN subdomain_prefix || org_slug || '.' || base_domain;
END;
$$;

-- Trigger to auto-generate primary_domain on organization insert/update
CREATE OR REPLACE FUNCTION public.auto_generate_primary_domain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only generate if primary_domain is not set
  IF NEW.primary_domain IS NULL OR NEW.primary_domain = '' THEN
    NEW.primary_domain := public.generate_primary_domain(NEW.slug);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_generate_primary_domain
BEFORE INSERT OR UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_primary_domain();

-- Backfill existing organizations with primary_domain
UPDATE public.organizations
SET primary_domain = public.generate_primary_domain(slug)
WHERE primary_domain IS NULL OR primary_domain = '';

-- Add trigger for updated_at on platform_settings
CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();