-- Add fields for public PDA creation
ALTER TABLE public.pdas
ADD COLUMN IF NOT EXISTS tracking_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS created_by_session_id TEXT;

-- Create index for tracking_id lookups
CREATE INDEX IF NOT EXISTS idx_pdas_tracking_id ON public.pdas(tracking_id);
CREATE INDEX IF NOT EXISTS idx_pdas_session_id ON public.pdas(created_by_session_id);

-- Function to generate unique tracking ID (8-character alphanumeric)
CREATE OR REPLACE FUNCTION generate_tracking_id()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate tracking_id on insert
CREATE OR REPLACE FUNCTION set_tracking_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_id IS NULL THEN
    NEW.tracking_id := generate_tracking_id();
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.pdas WHERE tracking_id = NEW.tracking_id) LOOP
      NEW.tracking_id := generate_tracking_id();
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_pda_tracking_id ON public.pdas;
CREATE TRIGGER set_pda_tracking_id
  BEFORE INSERT ON public.pdas
  FOR EACH ROW
  EXECUTE FUNCTION set_tracking_id();

-- Drop existing restrictive RLS policies on pdas
DROP POLICY IF EXISTS "pdas_tenant_select" ON public.pdas;
DROP POLICY IF EXISTS "pdas_tenant_insert" ON public.pdas;
DROP POLICY IF EXISTS "pdas_tenant_update" ON public.pdas;
DROP POLICY IF EXISTS "pdas_tenant_delete" ON public.pdas;

-- Allow public read access by tracking_id
CREATE POLICY "Public can view PDAs by tracking_id"
ON public.pdas
FOR SELECT
USING (
  tracking_id IS NOT NULL OR
  (tenant_id IN (SELECT get_user_org_ids(auth.uid()) AS get_user_org_ids)) OR
  has_role(auth.uid(), 'platformAdmin'::app_role)
);

-- Allow public insert with session tracking
CREATE POLICY "Anyone can create PDAs"
ON public.pdas
FOR INSERT
WITH CHECK (true);

-- Only tenant members or platform admins can update
CREATE POLICY "Tenant members can update their PDAs"
ON public.pdas
FOR UPDATE
USING (
  (tenant_id IN (SELECT get_user_org_ids(auth.uid()) AS get_user_org_ids)) OR
  has_role(auth.uid(), 'platformAdmin'::app_role)
);

-- Only tenant members or platform admins can delete
CREATE POLICY "Tenant members can delete their PDAs"
ON public.pdas
FOR DELETE
USING (
  (tenant_id IN (SELECT get_user_org_ids(auth.uid()) AS get_user_org_ids)) OR
  has_role(auth.uid(), 'platformAdmin'::app_role)
);