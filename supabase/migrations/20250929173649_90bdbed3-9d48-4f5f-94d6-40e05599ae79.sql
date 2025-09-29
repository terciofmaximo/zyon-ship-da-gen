-- Add settled_at field to fda_ledger for tracking payment settlement
ALTER TABLE public.fda_ledger
ADD COLUMN settled_at TIMESTAMP WITH TIME ZONE NULL;

-- Create index for filtering by settlement status
CREATE INDEX idx_fda_ledger_settled_at ON public.fda_ledger(settled_at);

-- Add comment
COMMENT ON COLUMN public.fda_ledger.settled_at IS 'Timestamp when the ledger line was marked as settled/paid';