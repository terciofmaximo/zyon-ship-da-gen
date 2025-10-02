-- Add custom_lines column to pdas table to store custom cost lines as JSON
ALTER TABLE public.pdas 
ADD COLUMN IF NOT EXISTS custom_lines jsonb DEFAULT '[]'::jsonb;

-- Add comment explaining the column
COMMENT ON COLUMN public.pdas.custom_lines IS 'Custom cost lines added by users beyond the standard 13 fixed cost items. Each line contains: id, label, costUSD, and comment.';