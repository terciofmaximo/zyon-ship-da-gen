-- Add new fields to fda table
ALTER TABLE public.fda
ADD COLUMN IF NOT EXISTS assigned_user_id UUID,
ADD COLUMN IF NOT EXISTS client_share_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fx_source TEXT;

-- Add index for assigned_user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_fda_assigned_user_id ON public.fda(assigned_user_id);