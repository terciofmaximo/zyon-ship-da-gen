-- Allow anonymous PDA creation by making tenant_id nullable
-- PDAs created by anonymous users will have NULL tenant_id
-- They will be linked to organizations later via auto_associate_organization_by_domain

ALTER TABLE public.pdas 
ALTER COLUMN tenant_id DROP NOT NULL;