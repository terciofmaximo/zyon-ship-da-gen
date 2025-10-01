-- Make pda_id nullable in fda table to allow FDA creation without PDA
-- FDA can exist independently or be created from a PDA
ALTER TABLE public.fda
ALTER COLUMN pda_id DROP NOT NULL;

-- Add comment to clarify the relationship
COMMENT ON COLUMN public.fda.pda_id IS 'Optional reference to PDA. NULL when FDA is created directly without a PDA.';