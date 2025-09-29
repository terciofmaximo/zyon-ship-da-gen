-- Drop and recreate the generate_pda_number function to fix ambiguous column reference
DROP FUNCTION IF EXISTS public.generate_pda_number(uuid);

CREATE OR REPLACE FUNCTION public.generate_pda_number(p_tenant_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_year TEXT;
  sequence_num INTEGER;
  pda_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM now())::TEXT;
  
  -- Get the next sequence number for this tenant and year
  SELECT COALESCE(MAX(
    CASE 
      WHEN pdas.pda_number ~ ('^PDA-' || current_year || '-[0-9]+$') 
      THEN CAST(SUBSTRING(pdas.pda_number FROM '^PDA-' || current_year || '-([0-9]+)$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO sequence_num
  FROM public.pdas
  WHERE pdas.tenant_id = p_tenant_id;
  
  pda_number := 'PDA-' || current_year || '-' || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN pda_number;
END;
$function$;

-- Temporarily modify RLS policies to work without authentication
-- This allows the hardcoded tenant_id to work until proper auth is implemented

DROP POLICY IF EXISTS "Users can create PDAs for their tenant" ON public.pdas;
DROP POLICY IF EXISTS "Users can view PDAs from their tenant" ON public.pdas;
DROP POLICY IF EXISTS "Users can update PDAs from their tenant" ON public.pdas;
DROP POLICY IF EXISTS "Users can delete PDAs from their tenant" ON public.pdas;

-- Create temporary policies that allow access for the mock tenant
CREATE POLICY "Allow access for mock tenant" 
ON public.pdas 
FOR ALL 
USING (tenant_id = '123e4567-e89b-12d3-a456-426614174000'::uuid)
WITH CHECK (tenant_id = '123e4567-e89b-12d3-a456-426614174000'::uuid);