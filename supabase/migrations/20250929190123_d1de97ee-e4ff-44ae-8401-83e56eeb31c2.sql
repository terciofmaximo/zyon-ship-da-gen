-- Enable RLS on all FDA tables
ALTER TABLE public.fda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fda_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fda_ledger_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fda_ledger_payments ENABLE ROW LEVEL SECURITY;

-- FDA table policies
CREATE POLICY "Users can view FDAs from their organizations"
ON public.fda
FOR SELECT
USING (
  tenant_id IN (SELECT get_user_org_ids(auth.uid()))
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can create FDAs in their organizations"
ON public.fda
FOR INSERT
WITH CHECK (
  tenant_id IN (SELECT get_user_org_ids(auth.uid()))
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can update FDAs in their organizations"
ON public.fda
FOR UPDATE
USING (
  tenant_id IN (SELECT get_user_org_ids(auth.uid()))
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can delete FDAs in their organizations"
ON public.fda
FOR DELETE
USING (
  tenant_id IN (SELECT get_user_org_ids(auth.uid()))
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

-- FDA Ledger policies
CREATE POLICY "Users can view ledger entries from their organizations"
ON public.fda_ledger
FOR SELECT
USING (
  tenant_id IN (SELECT get_user_org_ids(auth.uid()))
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can create ledger entries in their organizations"
ON public.fda_ledger
FOR INSERT
WITH CHECK (
  tenant_id IN (SELECT get_user_org_ids(auth.uid()))
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can update ledger entries in their organizations"
ON public.fda_ledger
FOR UPDATE
USING (
  tenant_id IN (SELECT get_user_org_ids(auth.uid()))
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can delete ledger entries in their organizations"
ON public.fda_ledger
FOR DELETE
USING (
  tenant_id IN (SELECT get_user_org_ids(auth.uid()))
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

-- FDA Ledger Attachments policies
CREATE POLICY "Users can view attachments from their organizations"
ON public.fda_ledger_attachments
FOR SELECT
USING (
  tenant_id IN (SELECT get_user_org_ids(auth.uid()))
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can create attachments in their organizations"
ON public.fda_ledger_attachments
FOR INSERT
WITH CHECK (
  tenant_id IN (SELECT get_user_org_ids(auth.uid()))
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can update attachments in their organizations"
ON public.fda_ledger_attachments
FOR UPDATE
USING (
  tenant_id IN (SELECT get_user_org_ids(auth.uid()))
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can delete attachments in their organizations"
ON public.fda_ledger_attachments
FOR DELETE
USING (
  tenant_id IN (SELECT get_user_org_ids(auth.uid()))
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

-- FDA Ledger Payments policies
CREATE POLICY "Users can view payments from their organizations"
ON public.fda_ledger_payments
FOR SELECT
USING (
  tenant_id IN (SELECT get_user_org_ids(auth.uid()))
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can create payments in their organizations"
ON public.fda_ledger_payments
FOR INSERT
WITH CHECK (
  tenant_id IN (SELECT get_user_org_ids(auth.uid()))
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can update payments in their organizations"
ON public.fda_ledger_payments
FOR UPDATE
USING (
  tenant_id IN (SELECT get_user_org_ids(auth.uid()))
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);

CREATE POLICY "Users can delete payments in their organizations"
ON public.fda_ledger_payments
FOR DELETE
USING (
  tenant_id IN (SELECT get_user_org_ids(auth.uid()))
  OR has_role(auth.uid(), 'platformAdmin'::app_role)
);