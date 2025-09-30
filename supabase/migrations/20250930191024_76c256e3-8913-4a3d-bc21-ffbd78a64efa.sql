-- Ensure contato@vesselopsportal.com has platformAdmin role
DO $$
DECLARE
  v_admin_user_id UUID;
BEGIN
  -- Get the user ID for the super admin email
  SELECT id INTO v_admin_user_id
  FROM auth.users
  WHERE email = 'contato@vesselopsportal.com'
  LIMIT 1;
  
  IF v_admin_user_id IS NOT NULL THEN
    -- Remove any existing roles
    DELETE FROM public.user_roles WHERE user_id = v_admin_user_id;
    
    -- Add platformAdmin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_admin_user_id, 'platformAdmin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Platform admin role assigned to contato@vesselopsportal.com';
  END IF;
END $$;

-- Improved function to extract clean slug from domain
CREATE OR REPLACE FUNCTION public.extract_slug_from_domain(p_domain TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
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

-- Improved auto-association function with super admin exception
CREATE OR REPLACE FUNCTION public.auto_associate_organization_by_domain(
  p_user_id uuid, 
  p_email text, 
  p_company_name text, 
  p_cnpj text, 
  p_company_type company_type, 
  p_session_id text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_domain TEXT;
  v_org_id UUID;
  v_is_first_user BOOLEAN;
  v_role TEXT;
  v_slug TEXT;
  v_is_super_admin BOOLEAN;
BEGIN
  -- Check if this is a super admin email
  v_is_super_admin := p_email = 'contato@vesselopsportal.com';
  
  -- If super admin, don't auto-associate to any specific tenant
  -- They will have access to all via platformAdmin role
  IF v_is_super_admin THEN
    RAISE NOTICE 'Super admin detected, skipping tenant association';
    RETURN NULL;
  END IF;
  
  -- Extract domain from email
  v_domain := LOWER(SPLIT_PART(p_email, '@', 2));
  
  -- Extract clean slug from domain
  v_slug := extract_slug_from_domain(v_domain);
  
  -- Look for existing organization with this domain
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE domain = v_domain
  LIMIT 1;
  
  IF v_org_id IS NULL THEN
    -- Check if an org with this slug already exists
    IF EXISTS (SELECT 1 FROM public.organizations WHERE slug = v_slug) THEN
      -- Add random suffix to make it unique
      v_slug := v_slug || '-' || FLOOR(RANDOM() * 10000)::TEXT;
    END IF;
    
    -- Create new organization
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
    
    RAISE NOTICE 'Created new organization % with slug % for domain %', v_org_id, v_slug, v_domain;
  ELSE
    -- Check if this is the first user from this domain
    SELECT NOT EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE org_id = v_org_id
    ) INTO v_is_first_user;
    
    -- First user gets admin, others get ops
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