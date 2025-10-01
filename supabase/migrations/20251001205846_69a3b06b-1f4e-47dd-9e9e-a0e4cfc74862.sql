-- Fix sync_fda_from_pda to handle NULL pda_id gracefully
CREATE OR REPLACE FUNCTION sync_fda_from_pda(p_fda_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pda_id UUID;
  v_tenant_id UUID;
  v_inserted_count INTEGER := 0;
BEGIN
  -- Get FDA's pda_id and tenant_id
  SELECT pda_id, tenant_id INTO v_pda_id, v_tenant_id
  FROM fda
  WHERE id = p_fda_id;

  -- If no PDA is linked, return 0 (no rows to sync)
  IF v_pda_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Insert missing PDA lines into fda_ledger
  WITH pda_costs AS (
    SELECT 
      'AP' as side,
      'Port Dues' as category,
      pda.port_dues_usd as amount_usd,
      pda.port_dues_brl as amount_local,
      'port_dues_usd' as pda_field
    FROM pda
    WHERE id = v_pda_id AND pda.port_dues_usd > 0
    
    UNION ALL
    
    SELECT 'AP', 'Pilotage', pda.pilotage_usd, pda.pilotage_brl, 'pilotage_usd'
    FROM pda WHERE id = v_pda_id AND pda.pilotage_usd > 0
    
    -- Add all other cost items similarly...
  )
  INSERT INTO fda_ledger (
    fda_id, line_no, side, category, description, 
    amount_usd, amount_local, status, tenant_id, pda_field, origin
  )
  SELECT 
    p_fda_id,
    (SELECT COALESCE(MAX(line_no), 0) FROM fda_ledger WHERE fda_id = p_fda_id) + ROW_NUMBER() OVER (),
    pc.side,
    pc.category,
    pc.category,
    pc.amount_usd,
    pc.amount_local,
    'Open',
    v_tenant_id,
    pc.pda_field,
    'PDA'
  FROM pda_costs pc
  WHERE NOT EXISTS (
    SELECT 1 FROM fda_ledger fl
    WHERE fl.fda_id = p_fda_id 
    AND fl.pda_field = pc.pda_field
  );

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  RETURN v_inserted_count;
END;
$$;