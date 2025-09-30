-- Update RLS policy for PDAs to allow anonymous users to update orphaned PDAs
-- Orphaned PDAs are those with tenant_id = NULL (not yet claimed by an organization)

DROP POLICY IF EXISTS "Tenant members can update their PDAs" ON public.pdas;

CREATE POLICY "Tenant members can update their PDAs" 
ON public.pdas 
FOR UPDATE 
USING (
  (tenant_id IN (SELECT get_user_org_ids(auth.uid()))) 
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
  OR (tenant_id IS NULL)  -- Allow updates to orphaned PDAs (anonymous users)
);