-- Add created_by field to track who created the PDA
ALTER TABLE public.pdas 
ADD COLUMN IF NOT EXISTS created_by uuid;

-- For existing PDAs without created_by, set to mock user (will be updated when auth is implemented)
UPDATE public.pdas 
SET created_by = '123e4567-e89b-12d3-a456-426614174000'::uuid 
WHERE created_by IS NULL;