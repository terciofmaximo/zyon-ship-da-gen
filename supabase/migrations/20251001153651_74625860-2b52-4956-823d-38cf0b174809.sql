-- Add 'platformAdmin' to the allowed roles in organization_members
ALTER TABLE public.organization_members 
  DROP CONSTRAINT IF EXISTS organization_members_role_check;

ALTER TABLE public.organization_members 
  ADD CONSTRAINT organization_members_role_check 
  CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'ops'::text, 'viewer'::text, 'platformAdmin'::text]));

-- Add master user as member of all existing organizations
INSERT INTO public.organization_members (org_id, user_id, role, created_at)
SELECT 
  o.id,
  u.id,
  'platformAdmin'::text,
  now()
FROM public.organizations o
CROSS JOIN auth.users u
WHERE LOWER(u.email) IN ('contato@vesselopsportal.com', 'contact@vesselopsportal.com')
  AND NOT EXISTS (
    SELECT 1 
    FROM public.organization_members m 
    WHERE m.org_id = o.id 
      AND m.user_id = u.id
  );

-- Create trigger to auto-add master user to new organizations
CREATE OR REPLACE FUNCTION public.add_master_to_new_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  master_user_id uuid;
BEGIN
  -- Get master user ID
  SELECT id INTO master_user_id
  FROM auth.users
  WHERE LOWER(email) IN ('contato@vesselopsportal.com', 'contact@vesselopsportal.com')
  LIMIT 1;

  -- Add master as platformAdmin if master user exists
  IF master_user_id IS NOT NULL THEN
    INSERT INTO public.organization_members (org_id, user_id, role, created_at)
    VALUES (NEW.id, master_user_id, 'platformAdmin', now())
    ON CONFLICT (org_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on organizations table
DROP TRIGGER IF EXISTS add_master_on_org_creation ON public.organizations;
CREATE TRIGGER add_master_on_org_creation
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.add_master_to_new_org();