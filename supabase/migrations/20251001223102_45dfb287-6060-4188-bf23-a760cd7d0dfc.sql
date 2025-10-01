-- Create table for FDA ledger comments
CREATE TABLE IF NOT EXISTS public.fda_ledger_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_id uuid NOT NULL,
  comment text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  tenant_id uuid NOT NULL
);

-- Enable RLS
ALTER TABLE public.fda_ledger_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view comments from their organizations
CREATE POLICY "Users can view comments from their orgs"
ON public.fda_ledger_comments FOR SELECT
USING (
  (tenant_id IN (SELECT get_user_org_ids(auth.uid())))
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

-- RLS Policy: Users can create comments in their organizations
CREATE POLICY "Users can create comments in their orgs"
ON public.fda_ledger_comments FOR INSERT
WITH CHECK (
  (tenant_id IN (SELECT get_user_org_ids(auth.uid())))
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

-- RLS Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.fda_ledger_comments FOR DELETE
USING (
  created_by = auth.uid()
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);