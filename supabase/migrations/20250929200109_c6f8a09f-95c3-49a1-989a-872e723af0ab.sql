-- Fix RLS policies for pdas table (was enabled but had no policies)

-- Add policies for pdas table
CREATE POLICY pdas_tenant_select ON public.pdas
FOR SELECT
USING (
  tenant_id IN (SELECT get_user_org_ids(auth.uid()))
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY pdas_tenant_insert ON public.pdas
FOR INSERT
WITH CHECK (
  tenant_id IN (SELECT get_user_org_ids(auth.uid()))
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY pdas_tenant_update ON public.pdas
FOR UPDATE
USING (
  tenant_id IN (SELECT get_user_org_ids(auth.uid()))
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY pdas_tenant_delete ON public.pdas
FOR DELETE
USING (
  tenant_id IN (SELECT get_user_org_ids(auth.uid()))
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);