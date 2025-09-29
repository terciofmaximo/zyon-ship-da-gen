-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS public.organization_members (
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'admin', 'ops', 'viewer')) NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  PRIMARY KEY (org_id, user_id)
);

-- Add tenant_id to fda tables
ALTER TABLE public.fda 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE public.fda_ledger 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE public.fda_ledger_attachments 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE public.fda_ledger_payments 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fda_tenant_created ON public.fda(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fda_ledger_tenant ON public.fda_ledger(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pdas_tenant_created ON public.pdas(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(org_id);

-- Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Seed demo organization
INSERT INTO public.organizations (name, slug)
VALUES ('Zyon Demo', 'zyon-demo')
ON CONFLICT (slug) DO NOTHING;

-- Backfill tenant_id for existing FDAs from their PDAs
UPDATE public.fda
SET tenant_id = (
  SELECT p.tenant_id 
  FROM public.pdas p 
  WHERE p.id = fda.pda_id
)
WHERE tenant_id IS NULL AND pda_id IS NOT NULL;

-- Backfill tenant_id for FDA ledger entries
UPDATE public.fda_ledger
SET tenant_id = (
  SELECT f.tenant_id 
  FROM public.fda f 
  WHERE f.id = fda_ledger.fda_id
)
WHERE tenant_id IS NULL;

-- Backfill tenant_id for FDA attachments
UPDATE public.fda_ledger_attachments
SET tenant_id = (
  SELECT fl.tenant_id 
  FROM public.fda_ledger fl 
  WHERE fl.id = fda_ledger_attachments.ledger_id
)
WHERE tenant_id IS NULL;

-- Backfill tenant_id for FDA payments
UPDATE public.fda_ledger_payments
SET tenant_id = (
  SELECT fl.tenant_id 
  FROM public.fda_ledger fl 
  WHERE fl.id = fda_ledger_payments.ledger_id
)
WHERE tenant_id IS NULL;

-- Add all existing users to demo org as admins
INSERT INTO public.organization_members (org_id, user_id, role)
SELECT 
  (SELECT id FROM public.organizations WHERE slug = 'zyon-demo'),
  id,
  'admin'
FROM auth.users
ON CONFLICT (org_id, user_id) DO NOTHING;

-- Set demo org as tenant for orphaned records (FDA without PDA)
UPDATE public.fda
SET tenant_id = (SELECT id FROM public.organizations WHERE slug = 'zyon-demo')
WHERE tenant_id IS NULL;

UPDATE public.fda_ledger
SET tenant_id = (SELECT id FROM public.organizations WHERE slug = 'zyon-demo')
WHERE tenant_id IS NULL;

-- Make tenant_id NOT NULL after backfill
ALTER TABLE public.fda 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.fda_ledger 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.fda_ledger_attachments 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.fda_ledger_payments 
ALTER COLUMN tenant_id SET NOT NULL;

-- Create helper view for user memberships
CREATE OR REPLACE VIEW public.user_org_memberships AS
SELECT org_id, user_id, role
FROM public.organization_members
WHERE user_id = auth.uid();

-- RLS Policies for organizations
CREATE POLICY "Users can view orgs they belong to"
ON public.organizations FOR SELECT
USING (
  id IN (SELECT org_id FROM public.user_org_memberships)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

-- RLS Policies for organization_members
CREATE POLICY "Users can view members of their orgs"
ON public.organization_members FOR SELECT
USING (
  org_id IN (SELECT org_id FROM public.user_org_memberships)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Org owners/admins can manage members"
ON public.organization_members FOR ALL
USING (
  org_id IN (
    SELECT org_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

-- Update PDA RLS policies to use tenant_id
DROP POLICY IF EXISTS "Users can create their own PDAs or admins can create any" ON public.pdas;
DROP POLICY IF EXISTS "Users can view their own PDAs or admins can view all" ON public.pdas;
DROP POLICY IF EXISTS "Users can update their own PDAs or admins can update any" ON public.pdas;
DROP POLICY IF EXISTS "Users can delete their own PDAs or admins can delete any" ON public.pdas;

CREATE POLICY "Users can view PDAs in their orgs"
ON public.pdas FOR SELECT
USING (
  tenant_id IN (SELECT org_id FROM public.user_org_memberships)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can create PDAs in their orgs"
ON public.pdas FOR INSERT
WITH CHECK (
  tenant_id IN (SELECT org_id FROM public.user_org_memberships)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can update PDAs in their orgs"
ON public.pdas FOR UPDATE
USING (
  tenant_id IN (SELECT org_id FROM public.user_org_memberships)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can delete PDAs in their orgs"
ON public.pdas FOR DELETE
USING (
  tenant_id IN (SELECT org_id FROM public.user_org_memberships)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

-- Update FDA RLS policies to use tenant_id
DROP POLICY IF EXISTS "Users can view their own FDAs or admins can view all" ON public.fda;
DROP POLICY IF EXISTS "Users can create their own FDAs or admins can create any" ON public.fda;
DROP POLICY IF EXISTS "Users can update their own FDAs or admins can update any" ON public.fda;
DROP POLICY IF EXISTS "Users can delete their own FDAs or admins can delete any" ON public.fda;

CREATE POLICY "Users can view FDAs in their orgs"
ON public.fda FOR SELECT
USING (
  tenant_id IN (SELECT org_id FROM public.user_org_memberships)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can create FDAs in their orgs"
ON public.fda FOR INSERT
WITH CHECK (
  tenant_id IN (SELECT org_id FROM public.user_org_memberships)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can update FDAs in their orgs"
ON public.fda FOR UPDATE
USING (
  tenant_id IN (SELECT org_id FROM public.user_org_memberships)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can delete FDAs in their orgs"
ON public.fda FOR DELETE
USING (
  tenant_id IN (SELECT org_id FROM public.user_org_memberships)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

-- Update FDA ledger RLS policies
DROP POLICY IF EXISTS "Users can view ledger for their own FDAs or admins can view all" ON public.fda_ledger;
DROP POLICY IF EXISTS "Users can create ledger for their own FDAs or admins can create" ON public.fda_ledger;
DROP POLICY IF EXISTS "Users can update ledger for their own FDAs or admins can update" ON public.fda_ledger;
DROP POLICY IF EXISTS "Users can delete ledger for their own FDAs or admins can delete" ON public.fda_ledger;

CREATE POLICY "Users can view ledger in their orgs"
ON public.fda_ledger FOR SELECT
USING (
  tenant_id IN (SELECT org_id FROM public.user_org_memberships)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can create ledger in their orgs"
ON public.fda_ledger FOR INSERT
WITH CHECK (
  tenant_id IN (SELECT org_id FROM public.user_org_memberships)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can update ledger in their orgs"
ON public.fda_ledger FOR UPDATE
USING (
  tenant_id IN (SELECT org_id FROM public.user_org_memberships)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can delete ledger in their orgs"
ON public.fda_ledger FOR DELETE
USING (
  tenant_id IN (SELECT org_id FROM public.user_org_memberships)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

-- Update FDA attachments RLS policies
DROP POLICY IF EXISTS "Users can view attachments for their own FDAs or admins can vie" ON public.fda_ledger_attachments;
DROP POLICY IF EXISTS "Users can insert attachments for their own FDAs or admins can i" ON public.fda_ledger_attachments;
DROP POLICY IF EXISTS "Users can delete attachments for their own FDAs or admins can d" ON public.fda_ledger_attachments;

CREATE POLICY "Users can view attachments in their orgs"
ON public.fda_ledger_attachments FOR SELECT
USING (
  tenant_id IN (SELECT org_id FROM public.user_org_memberships)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can insert attachments in their orgs"
ON public.fda_ledger_attachments FOR INSERT
WITH CHECK (
  tenant_id IN (SELECT org_id FROM public.user_org_memberships)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can delete attachments in their orgs"
ON public.fda_ledger_attachments FOR DELETE
USING (
  tenant_id IN (SELECT org_id FROM public.user_org_memberships)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

-- Update FDA payments RLS policies
DROP POLICY IF EXISTS "Users can view payments for their own FDAs or admins can view a" ON public.fda_ledger_payments;
DROP POLICY IF EXISTS "Users can insert payments for their own FDAs or admins can inse" ON public.fda_ledger_payments;
DROP POLICY IF EXISTS "Users can update payments for their own FDAs or admins can upda" ON public.fda_ledger_payments;
DROP POLICY IF EXISTS "Users can delete payments for their own FDAs or admins can dele" ON public.fda_ledger_payments;

CREATE POLICY "Users can view payments in their orgs"
ON public.fda_ledger_payments FOR SELECT
USING (
  tenant_id IN (SELECT org_id FROM public.user_org_memberships)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can insert payments in their orgs"
ON public.fda_ledger_payments FOR INSERT
WITH CHECK (
  tenant_id IN (SELECT org_id FROM public.user_org_memberships)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can update payments in their orgs"
ON public.fda_ledger_payments FOR UPDATE
USING (
  tenant_id IN (SELECT org_id FROM public.user_org_memberships)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can delete payments in their orgs"
ON public.fda_ledger_payments FOR DELETE
USING (
  tenant_id IN (SELECT org_id FROM public.user_org_memberships)
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);