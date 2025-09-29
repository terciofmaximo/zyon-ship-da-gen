-- Create security definer function to check if user is admin/owner of an org
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = _user_id
    AND om.org_id = _org_id
    AND om.role IN ('owner', 'admin')
  );
$$;

-- Drop and recreate the problematic policy
DROP POLICY IF EXISTS "Org owners/admins can manage members" ON public.organization_members;

CREATE POLICY "Org owners/admins can manage members"
ON public.organization_members
FOR ALL
USING (
  -- Only owners/admins of the org can manage members
  public.is_org_admin(auth.uid(), org_id)
  -- Or they're platformAdmin
  OR public.has_role(auth.uid(), 'platformAdmin'::app_role)
);