-- Add pda_field column to fda_ledger to track source PDA field
ALTER TABLE public.fda_ledger 
ADD COLUMN IF NOT EXISTS pda_field TEXT;

-- Add origin column to track if line came from PDA or was manually added
ALTER TABLE public.fda_ledger 
ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT 'PDA' CHECK (origin IN ('PDA', 'MANUAL'));

-- Backfill existing fda_ledger entries with pda_field from source JSON
UPDATE public.fda_ledger
SET pda_field = (source->>'pdaField')::TEXT,
    origin = 'PDA'
WHERE source IS NOT NULL 
  AND source->>'pdaField' IS NOT NULL
  AND pda_field IS NULL;

-- Remove duplicates keeping only the earliest created entry
DELETE FROM public.fda_ledger a
USING public.fda_ledger b
WHERE a.id > b.id
  AND a.fda_id = b.fda_id
  AND a.pda_field IS NOT NULL
  AND b.pda_field IS NOT NULL
  AND a.pda_field = b.pda_field;

-- Drop index if exists
DROP INDEX IF EXISTS fda_ledger_pda_field_unique;

-- Create unique index only on rows where pda_field is not null
CREATE UNIQUE INDEX fda_ledger_pda_field_unique 
ON public.fda_ledger (fda_id, pda_field) 
WHERE pda_field IS NOT NULL;

-- Function to sync missing PDA items into FDA ledger (idempotent)
CREATE OR REPLACE FUNCTION sync_fda_from_pda(p_fda_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_pda_id UUID;
  v_tenant_id UUID;
  v_exchange_rate NUMERIC;
  v_line_no INTEGER;
  v_inserted_count INTEGER := 0;
  v_amount NUMERIC;
  v_client_name TEXT;
BEGIN
  -- Get FDA details
  SELECT pda_id, tenant_id, exchange_rate, client_name
  INTO v_pda_id, v_tenant_id, v_exchange_rate, v_client_name
  FROM public.fda
  WHERE id = p_fda_id;

  IF v_pda_id IS NULL THEN
    RAISE EXCEPTION 'FDA % not found or has no linked PDA', p_fda_id;
  END IF;

  -- Get next line_no
  SELECT COALESCE(MAX(line_no), 0) + 1
  INTO v_line_no
  FROM public.fda_ledger
  WHERE fda_id = p_fda_id;

  -- Insert missing PDA fields into FDA ledger
  -- pilotage_in
  SELECT pilotage_in INTO v_amount FROM public.pdas WHERE id = v_pda_id;
  IF NOT EXISTS (SELECT 1 FROM public.fda_ledger WHERE fda_id = p_fda_id AND pda_field = 'pilotage_in') THEN
    INSERT INTO public.fda_ledger (fda_id, line_no, side, category, description, counterparty, amount_usd, amount_local, status, tenant_id, pda_field, origin, source)
    VALUES (p_fda_id, v_line_no, 'AP', 'Pilot IN/OUT', 'Pilot IN/OUT', 'Vendor — to assign', 
            COALESCE(v_amount, 0), COALESCE(v_amount, 0) * v_exchange_rate, 'Open', v_tenant_id, 'pilotage_in', 'PDA',
            jsonb_build_object('pdaField', 'pilotage_in', 'originalAmount', COALESCE(v_amount, 0), 'exchangeRate', v_exchange_rate));
    v_line_no := v_line_no + 1;
    v_inserted_count := v_inserted_count + 1;
  END IF;

  -- towage_in
  SELECT towage_in INTO v_amount FROM public.pdas WHERE id = v_pda_id;
  IF NOT EXISTS (SELECT 1 FROM public.fda_ledger WHERE fda_id = p_fda_id AND pda_field = 'towage_in') THEN
    INSERT INTO public.fda_ledger (fda_id, line_no, side, category, description, counterparty, amount_usd, amount_local, status, tenant_id, pda_field, origin, source)
    VALUES (p_fda_id, v_line_no, 'AP', 'Towage IN/OUT', 'Towage IN/OUT', 'Vendor — to assign', 
            COALESCE(v_amount, 0), COALESCE(v_amount, 0) * v_exchange_rate, 'Open', v_tenant_id, 'towage_in', 'PDA',
            jsonb_build_object('pdaField', 'towage_in', 'originalAmount', COALESCE(v_amount, 0), 'exchangeRate', v_exchange_rate));
    v_line_no := v_line_no + 1;
    v_inserted_count := v_inserted_count + 1;
  END IF;

  -- light_dues
  SELECT light_dues INTO v_amount FROM public.pdas WHERE id = v_pda_id;
  IF NOT EXISTS (SELECT 1 FROM public.fda_ledger WHERE fda_id = p_fda_id AND pda_field = 'light_dues') THEN
    INSERT INTO public.fda_ledger (fda_id, line_no, side, category, description, counterparty, amount_usd, amount_local, status, tenant_id, pda_field, origin, source)
    VALUES (p_fda_id, v_line_no, 'AP', 'Light dues', 'Light dues', 'Vendor — to assign', 
            COALESCE(v_amount, 0), COALESCE(v_amount, 0) * v_exchange_rate, 'Open', v_tenant_id, 'light_dues', 'PDA',
            jsonb_build_object('pdaField', 'light_dues', 'originalAmount', COALESCE(v_amount, 0), 'exchangeRate', v_exchange_rate));
    v_line_no := v_line_no + 1;
    v_inserted_count := v_inserted_count + 1;
  END IF;

  -- dockage
  SELECT dockage INTO v_amount FROM public.pdas WHERE id = v_pda_id;
  IF NOT EXISTS (SELECT 1 FROM public.fda_ledger WHERE fda_id = p_fda_id AND pda_field = 'dockage') THEN
    INSERT INTO public.fda_ledger (fda_id, line_no, side, category, description, counterparty, amount_usd, amount_local, status, tenant_id, pda_field, origin, source)
    VALUES (p_fda_id, v_line_no, 'AP', 'Dockage (Wharfage)', 'Dockage (Wharfage)', 'Vendor — to assign', 
            COALESCE(v_amount, 0), COALESCE(v_amount, 0) * v_exchange_rate, 'Open', v_tenant_id, 'dockage', 'PDA',
            jsonb_build_object('pdaField', 'dockage', 'originalAmount', COALESCE(v_amount, 0), 'exchangeRate', v_exchange_rate));
    v_line_no := v_line_no + 1;
    v_inserted_count := v_inserted_count + 1;
  END IF;

  -- linesman
  SELECT linesman INTO v_amount FROM public.pdas WHERE id = v_pda_id;
  IF NOT EXISTS (SELECT 1 FROM public.fda_ledger WHERE fda_id = p_fda_id AND pda_field = 'linesman') THEN
    INSERT INTO public.fda_ledger (fda_id, line_no, side, category, description, counterparty, amount_usd, amount_local, status, tenant_id, pda_field, origin, source)
    VALUES (p_fda_id, v_line_no, 'AP', 'Linesman (mooring/unmooring)', 'Linesman (mooring/unmooring)', 'Vendor — to assign', 
            COALESCE(v_amount, 0), COALESCE(v_amount, 0) * v_exchange_rate, 'Open', v_tenant_id, 'linesman', 'PDA',
            jsonb_build_object('pdaField', 'linesman', 'originalAmount', COALESCE(v_amount, 0), 'exchangeRate', v_exchange_rate));
    v_line_no := v_line_no + 1;
    v_inserted_count := v_inserted_count + 1;
  END IF;

  -- launch_boat
  SELECT launch_boat INTO v_amount FROM public.pdas WHERE id = v_pda_id;
  IF NOT EXISTS (SELECT 1 FROM public.fda_ledger WHERE fda_id = p_fda_id AND pda_field = 'launch_boat') THEN
    INSERT INTO public.fda_ledger (fda_id, line_no, side, category, description, counterparty, amount_usd, amount_local, status, tenant_id, pda_field, origin, source)
    VALUES (p_fda_id, v_line_no, 'AP', 'Launch boat (mooring/unmooring)', 'Launch boat (mooring/unmooring)', 'Vendor — to assign', 
            COALESCE(v_amount, 0), COALESCE(v_amount, 0) * v_exchange_rate, 'Open', v_tenant_id, 'launch_boat', 'PDA',
            jsonb_build_object('pdaField', 'launch_boat', 'originalAmount', COALESCE(v_amount, 0), 'exchangeRate', v_exchange_rate));
    v_line_no := v_line_no + 1;
    v_inserted_count := v_inserted_count + 1;
  END IF;

  -- immigration
  SELECT immigration INTO v_amount FROM public.pdas WHERE id = v_pda_id;
  IF NOT EXISTS (SELECT 1 FROM public.fda_ledger WHERE fda_id = p_fda_id AND pda_field = 'immigration') THEN
    INSERT INTO public.fda_ledger (fda_id, line_no, side, category, description, counterparty, amount_usd, amount_local, status, tenant_id, pda_field, origin, source)
    VALUES (p_fda_id, v_line_no, 'AP', 'Immigration tax (Funapol)', 'Immigration tax (Funapol)', 'Vendor — to assign', 
            COALESCE(v_amount, 0), COALESCE(v_amount, 0) * v_exchange_rate, 'Open', v_tenant_id, 'immigration', 'PDA',
            jsonb_build_object('pdaField', 'immigration', 'originalAmount', COALESCE(v_amount, 0), 'exchangeRate', v_exchange_rate));
    v_line_no := v_line_no + 1;
    v_inserted_count := v_inserted_count + 1;
  END IF;

  -- free_pratique
  SELECT free_pratique INTO v_amount FROM public.pdas WHERE id = v_pda_id;
  IF NOT EXISTS (SELECT 1 FROM public.fda_ledger WHERE fda_id = p_fda_id AND pda_field = 'free_pratique') THEN
    INSERT INTO public.fda_ledger (fda_id, line_no, side, category, description, counterparty, amount_usd, amount_local, status, tenant_id, pda_field, origin, source)
    VALUES (p_fda_id, v_line_no, 'AP', 'Free pratique tax', 'Free pratique tax', 'Vendor — to assign', 
            COALESCE(v_amount, 0), COALESCE(v_amount, 0) * v_exchange_rate, 'Open', v_tenant_id, 'free_pratique', 'PDA',
            jsonb_build_object('pdaField', 'free_pratique', 'originalAmount', COALESCE(v_amount, 0), 'exchangeRate', v_exchange_rate));
    v_line_no := v_line_no + 1;
    v_inserted_count := v_inserted_count + 1;
  END IF;

  -- shipping_association
  SELECT shipping_association INTO v_amount FROM public.pdas WHERE id = v_pda_id;
  IF NOT EXISTS (SELECT 1 FROM public.fda_ledger WHERE fda_id = p_fda_id AND pda_field = 'shipping_association') THEN
    INSERT INTO public.fda_ledger (fda_id, line_no, side, category, description, counterparty, amount_usd, amount_local, status, tenant_id, pda_field, origin, source)
    VALUES (p_fda_id, v_line_no, 'AP', 'Shipping association', 'Shipping association', 'Vendor — to assign', 
            COALESCE(v_amount, 0), COALESCE(v_amount, 0) * v_exchange_rate, 'Open', v_tenant_id, 'shipping_association', 'PDA',
            jsonb_build_object('pdaField', 'shipping_association', 'originalAmount', COALESCE(v_amount, 0), 'exchangeRate', v_exchange_rate));
    v_line_no := v_line_no + 1;
    v_inserted_count := v_inserted_count + 1;
  END IF;

  -- clearance
  SELECT clearance INTO v_amount FROM public.pdas WHERE id = v_pda_id;
  IF NOT EXISTS (SELECT 1 FROM public.fda_ledger WHERE fda_id = p_fda_id AND pda_field = 'clearance') THEN
    INSERT INTO public.fda_ledger (fda_id, line_no, side, category, description, counterparty, amount_usd, amount_local, status, tenant_id, pda_field, origin, source)
    VALUES (p_fda_id, v_line_no, 'AP', 'Clearance', 'Clearance', 'Vendor — to assign', 
            COALESCE(v_amount, 0), COALESCE(v_amount, 0) * v_exchange_rate, 'Open', v_tenant_id, 'clearance', 'PDA',
            jsonb_build_object('pdaField', 'clearance', 'originalAmount', COALESCE(v_amount, 0), 'exchangeRate', v_exchange_rate));
    v_line_no := v_line_no + 1;
    v_inserted_count := v_inserted_count + 1;
  END IF;

  -- paperless_port
  SELECT paperless_port INTO v_amount FROM public.pdas WHERE id = v_pda_id;
  IF NOT EXISTS (SELECT 1 FROM public.fda_ledger WHERE fda_id = p_fda_id AND pda_field = 'paperless_port') THEN
    INSERT INTO public.fda_ledger (fda_id, line_no, side, category, description, counterparty, amount_usd, amount_local, status, tenant_id, pda_field, origin, source)
    VALUES (p_fda_id, v_line_no, 'AP', 'Paperless Port System', 'Paperless Port System', 'Vendor — to assign', 
            COALESCE(v_amount, 0), COALESCE(v_amount, 0) * v_exchange_rate, 'Open', v_tenant_id, 'paperless_port', 'PDA',
            jsonb_build_object('pdaField', 'paperless_port', 'originalAmount', COALESCE(v_amount, 0), 'exchangeRate', v_exchange_rate));
    v_line_no := v_line_no + 1;
    v_inserted_count := v_inserted_count + 1;
  END IF;

  -- agency_fee (AR side)
  SELECT agency_fee INTO v_amount FROM public.pdas WHERE id = v_pda_id;
  IF NOT EXISTS (SELECT 1 FROM public.fda_ledger WHERE fda_id = p_fda_id AND pda_field = 'agency_fee') THEN
    INSERT INTO public.fda_ledger (fda_id, line_no, side, category, description, counterparty, amount_usd, amount_local, status, tenant_id, pda_field, origin, source)
    VALUES (p_fda_id, v_line_no, 'AR', 'Agency fee', 'Agency fee', COALESCE(v_client_name, 'Client'), 
            COALESCE(v_amount, 0), COALESCE(v_amount, 0) * v_exchange_rate, 'Open', v_tenant_id, 'agency_fee', 'PDA',
            jsonb_build_object('pdaField', 'agency_fee', 'originalAmount', COALESCE(v_amount, 0), 'exchangeRate', v_exchange_rate));
    v_line_no := v_line_no + 1;
    v_inserted_count := v_inserted_count + 1;
  END IF;

  -- waterway
  SELECT waterway INTO v_amount FROM public.pdas WHERE id = v_pda_id;
  IF NOT EXISTS (SELECT 1 FROM public.fda_ledger WHERE fda_id = p_fda_id AND pda_field = 'waterway') THEN
    INSERT INTO public.fda_ledger (fda_id, line_no, side, category, description, counterparty, amount_usd, amount_local, status, tenant_id, pda_field, origin, source)
    VALUES (p_fda_id, v_line_no, 'AP', 'Waterway channel (Table I)', 'Waterway channel (Table I)', 'Vendor — to assign', 
            COALESCE(v_amount, 0), COALESCE(v_amount, 0) * v_exchange_rate, 'Open', v_tenant_id, 'waterway', 'PDA',
            jsonb_build_object('pdaField', 'waterway', 'originalAmount', COALESCE(v_amount, 0), 'exchangeRate', v_exchange_rate));
    v_line_no := v_line_no + 1;
    v_inserted_count := v_inserted_count + 1;
  END IF;

  RETURN v_inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;