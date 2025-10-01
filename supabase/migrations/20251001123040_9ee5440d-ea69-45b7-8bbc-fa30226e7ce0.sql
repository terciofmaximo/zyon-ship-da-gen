-- Create Vessel Ops Portal organization and associate user (Simplified version)
-- This fixes the "User must belong to an organization" error for contato@vesselopsportal.com

DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_existing_org_id UUID;
BEGIN
  -- Get the user ID for contato@vesselopsportal.com
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'contato@vesselopsportal.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User contato@vesselopsportal.com not found';
  END IF;

  -- Check if organization already exists
  SELECT id INTO v_existing_org_id
  FROM public.organizations
  WHERE domain = 'vesselopsportal.com'
     OR slug = 'vesselopsportal'
  LIMIT 1;

  IF v_existing_org_id IS NOT NULL THEN
    -- Organization exists, just associate user if not already associated
    v_org_id := v_existing_org_id;
    
    INSERT INTO public.organization_members (org_id, user_id, role)
    VALUES (v_org_id, v_user_id, 'owner')
    ON CONFLICT (org_id, user_id) DO UPDATE
    SET role = 'owner';
    
    RAISE NOTICE 'User associated with existing organization %', v_org_id;
  ELSE
    -- Create new organization
    INSERT INTO public.organizations (
      name,
      slug,
      domain,
      owner_user_id,
      created_from_signup
    ) VALUES (
      'Vessel Ops Portal',
      'vesselopsportal',
      'vesselopsportal.com',
      v_user_id,
      true
    ) RETURNING id INTO v_org_id;

    -- Associate user as owner
    INSERT INTO public.organization_members (org_id, user_id, role)
    VALUES (v_org_id, v_user_id, 'owner');

    RAISE NOTICE 'Created new organization % and associated user', v_org_id;
  END IF;

  -- Give the user platformAdmin role to access all organizations
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'platformAdmin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'Migration completed successfully for user %', v_user_id;
  RAISE NOTICE 'To link existing orphaned PDAs, manually update their tenant_id to: %', v_org_id;
END $$;