-- Fix RLS policies for platformAdmin to create companies

-- ============================================
-- RLS on public.organizations
-- ============================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if any
DROP POLICY IF EXISTS org_select ON public.organizations;
DROP POLICY IF EXISTS org_insert_admin ON public.organizations;
DROP POLICY IF EXISTS org_update_admin ON public.organizations;
DROP POLICY IF EXISTS org_delete_admin ON public.organizations;

-- SELECT: members OR platformAdmin
CREATE POLICY org_select ON public.organizations
FOR SELECT
USING (
  id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid())
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

-- INSERT: platformAdmin only
CREATE POLICY org_insert_admin ON public.organizations
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'platformAdmin'::app_role));

-- UPDATE: platformAdmin only (for now, can add org admins later)
CREATE POLICY org_update_admin ON public.organizations
FOR UPDATE
USING (has_role(auth.uid(), 'platformAdmin'::app_role));

-- DELETE: platformAdmin only
CREATE POLICY org_delete_admin ON public.organizations
FOR DELETE
USING (has_role(auth.uid(), 'platformAdmin'::app_role));

-- ============================================
-- Update RLS on public.organization_domains
-- ============================================
-- Add platformAdmin bypass to existing policies
DROP POLICY IF EXISTS "Org admins can create domains" ON public.organization_domains;
DROP POLICY IF EXISTS "Org admins can delete domains" ON public.organization_domains;
DROP POLICY IF EXISTS "Org admins can update domains" ON public.organization_domains;
DROP POLICY IF EXISTS "Org admins can view domains" ON public.organization_domains;

CREATE POLICY org_domains_select ON public.organization_domains
FOR SELECT
USING (
  is_org_admin(auth.uid(), org_id)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY org_domains_insert ON public.organization_domains
FOR INSERT
WITH CHECK (
  is_org_admin(auth.uid(), org_id)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY org_domains_update ON public.organization_domains
FOR UPDATE
USING (
  is_org_admin(auth.uid(), org_id)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY org_domains_delete ON public.organization_domains
FOR DELETE
USING (
  is_org_admin(auth.uid(), org_id)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

-- ============================================
-- Update RLS on public.organization_members
-- ============================================
DROP POLICY IF EXISTS "Org owners/admins can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view org members" ON public.organization_members;

-- platformAdmin can do everything
CREATE POLICY org_members_admin_all ON public.organization_members
FOR ALL
USING (has_role(auth.uid(), 'platformAdmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'platformAdmin'::app_role));

-- Org admins can manage members
CREATE POLICY org_members_admin_manage ON public.organization_members
FOR ALL
USING (is_org_admin(auth.uid(), org_id));

-- Users can view members in their orgs
CREATE POLICY org_members_view ON public.organization_members
FOR SELECT
USING (
  org_id IN (SELECT get_user_org_ids(auth.uid()))
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

-- ============================================
-- Update RLS on public.organization_invites
-- ============================================
DROP POLICY IF EXISTS "Org admins can create invites" ON public.organization_invites;
DROP POLICY IF EXISTS "Org admins can update invites" ON public.organization_invites;
DROP POLICY IF EXISTS "Org admins can view invites" ON public.organization_invites;

-- platformAdmin has full access
CREATE POLICY org_invites_admin_all ON public.organization_invites
FOR ALL
USING (has_role(auth.uid(), 'platformAdmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'platformAdmin'::app_role));

-- Org admins can create invites
CREATE POLICY org_invites_admin_create ON public.organization_invites
FOR INSERT
WITH CHECK (is_org_admin(auth.uid(), org_id));

-- Org admins can view and update invites
CREATE POLICY org_invites_admin_manage ON public.organization_invites
FOR SELECT
USING (is_org_admin(auth.uid(), org_id));

CREATE POLICY org_invites_admin_update ON public.organization_invites
FOR UPDATE
USING (is_org_admin(auth.uid(), org_id));