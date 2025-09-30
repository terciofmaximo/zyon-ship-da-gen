-- Add company_type enum for signup
CREATE TYPE company_type AS ENUM ('Armador', 'Agente', 'Broker');

-- Add fields to organizations for company registration
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS company_type company_type,
ADD COLUMN IF NOT EXISTS created_from_signup BOOLEAN DEFAULT false;

-- Create email verification table for custom SMTP option
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON public.email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON public.email_verifications(user_id);

-- Enable RLS on email_verifications
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verifications"
ON public.email_verifications
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Service can manage verifications"
ON public.email_verifications
FOR ALL
USING (true)
WITH CHECK (true);

-- Add function to link PDA to organization after user signs up
CREATE OR REPLACE FUNCTION link_pda_to_new_org(p_pda_id UUID, p_org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.pdas
  SET tenant_id = p_org_id,
      created_by = (SELECT owner_user_id FROM public.organizations WHERE id = p_org_id)
  WHERE id = p_pda_id
    AND tenant_id IS NULL;
END;
$$;

-- Function to convert PDA to FDA (requires authentication)
CREATE OR REPLACE FUNCTION convert_pda_to_fda(p_pda_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pda_record RECORD;
  v_fda_id UUID;
  v_user_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to convert PDA to FDA';
  END IF;
  
  -- Get PDA details
  SELECT * INTO v_pda_record
  FROM public.pdas
  WHERE id = p_pda_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PDA not found';
  END IF;
  
  -- Get user's tenant
  SELECT org_id INTO v_tenant_id
  FROM public.organization_members
  WHERE user_id = v_user_id
  LIMIT 1;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User must belong to an organization';
  END IF;
  
  -- Create FDA from PDA
  INSERT INTO public.fda (
    pda_id,
    tenant_id,
    vessel_name,
    imo,
    port,
    terminal,
    client_name,
    exchange_rate,
    status,
    created_by
  ) VALUES (
    p_pda_id,
    v_tenant_id,
    v_pda_record.vessel_name,
    v_pda_record.imo_number,
    v_pda_record.port_name,
    v_pda_record.terminal,
    v_pda_record.to_display_name,
    COALESCE(v_pda_record.exchange_rate::numeric, 1),
    'Draft'::fda_status,
    v_user_id
  ) RETURNING id INTO v_fda_id;
  
  -- Sync ledger from PDA
  PERFORM sync_fda_from_pda(v_fda_id);
  
  RETURN v_fda_id;
END;
$$;