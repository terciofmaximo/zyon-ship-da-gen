-- Add remarks column to fda table
ALTER TABLE public.fda 
ADD COLUMN IF NOT EXISTS remarks text;