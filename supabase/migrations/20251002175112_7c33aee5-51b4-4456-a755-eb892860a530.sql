-- Add IOF and Bank Charges columns to pdas table
ALTER TABLE public.pdas 
ADD COLUMN IF NOT EXISTS iof numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS bank_charges numeric DEFAULT 0;