-- Add paid_to_supplier_usd field to fda_ledger table
ALTER TABLE public.fda_ledger 
ADD COLUMN IF NOT EXISTS paid_to_supplier_usd numeric DEFAULT 0;