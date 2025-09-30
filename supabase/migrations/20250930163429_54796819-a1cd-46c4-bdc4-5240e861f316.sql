-- Add domain field to organizations for auto-association
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS domain TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_organizations_domain ON public.organizations(domain);

-- Function to auto-associate or create organization by email domain
CREATE OR REPLACE FUNCTION auto_associate_organization_by_domain(
  p_user_id UUID,
  p_email TEXT,
  p_company_name TEXT,
  p_cnpj TEXT,
  p_company_type company_type,
  p_session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_domain TEXT;
  v_org_id UUID;
  v_is_first_user BOOLEAN;
  v_role TEXT;
  v_slug TEXT;
BEGIN
  -- Extract domain from email
  v_domain := LOWER(SPLIT_PART(p_email, '@', 2));
  
  -- Look for existing organization with this domain
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE domain = v_domain
  LIMIT 1;
  
  IF v_org_id IS NULL THEN
    -- Create new organization
    v_slug := LOWER(REGEXP_REPLACE(
      REGEXP_REPLACE(p_company_name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ));
    
    -- Ensure unique slug
    WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = v_slug) LOOP
      v_slug := v_slug || '-' || FLOOR(RANDOM() * 1000)::TEXT;
    END LOOP;
    
    INSERT INTO public.organizations (
      name,
      slug,
      domain,
      cnpj,
      company_type,
      owner_user_id,
      created_from_signup
    ) VALUES (
      p_company_name,
      v_slug,
      v_domain,
      p_cnpj,
      p_company_type,
      p_user_id,
      true
    ) RETURNING id INTO v_org_id;
    
    v_role := 'owner';
    v_is_first_user := true;
  ELSE
    -- Check if this is the first user from this domain
    SELECT NOT EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE org_id = v_org_id
    ) INTO v_is_first_user;
    
    -- First user gets admin, others get member
    v_role := CASE WHEN v_is_first_user THEN 'admin' ELSE 'ops' END;
  END IF;
  
  -- Add user to organization
  INSERT INTO public.organization_members (org_id, user_id, role)
  VALUES (v_org_id, p_user_id, v_role)
  ON CONFLICT (org_id, user_id) DO NOTHING;
  
  -- Link orphaned PDAs from this session to the organization
  IF p_session_id IS NOT NULL THEN
    UPDATE public.pdas
    SET 
      tenant_id = v_org_id,
      created_by = p_user_id
    WHERE created_by_session_id = p_session_id
      AND tenant_id IS NULL;
  END IF;
  
  RETURN v_org_id;
END;
$$;

-- Trigger to auto-associate on user creation (after email confirmation)
CREATE OR REPLACE FUNCTION auto_associate_user_on_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_company_name TEXT;
  v_cnpj TEXT;
  v_company_type company_type;
BEGIN
  -- Only proceed if email is confirmed and user doesn't have organization yet
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    -- Check if user already has an organization
    IF NOT EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE user_id = NEW.id
    ) THEN
      -- Get company details from user metadata
      v_company_name := NEW.raw_user_meta_data->>'company_name';
      v_cnpj := NEW.raw_user_meta_data->>'cnpj';
      v_company_type := (NEW.raw_user_meta_data->>'company_type')::company_type;
      
      -- Auto-associate or create organization
      IF v_company_name IS NOT NULL THEN
        v_org_id := auto_associate_organization_by_domain(
          NEW.id,
          NEW.email,
          v_company_name,
          v_cnpj,
          v_company_type,
          NEW.raw_user_meta_data->>'session_id'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for auto-association
DROP TRIGGER IF EXISTS on_user_email_confirmed ON auth.users;
CREATE TRIGGER on_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION auto_associate_user_on_confirm();