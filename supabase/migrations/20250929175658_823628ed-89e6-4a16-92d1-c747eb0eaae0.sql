-- Create table for partial payments on ledger lines
CREATE TABLE IF NOT EXISTS public.fda_ledger_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_id UUID NOT NULL REFERENCES public.fda_ledger(id) ON DELETE CASCADE,
  paid_at DATE NOT NULL,
  amount_usd NUMERIC NOT NULL,
  amount_local NUMERIC NOT NULL,
  fx_at_payment NUMERIC NOT NULL,
  method TEXT NOT NULL,
  reference TEXT,
  receipt_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for ledger line attachments
CREATE TABLE IF NOT EXISTS public.fda_ledger_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_id UUID NOT NULL REFERENCES public.fda_ledger(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

-- Add new fields to fda_ledger for the details page
ALTER TABLE public.fda_ledger 
ADD COLUMN IF NOT EXISTS invoice_date DATE,
ADD COLUMN IF NOT EXISTS payment_terms TEXT,
ADD COLUMN IF NOT EXISTS client_po TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS use_custom_fx BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_fx_rate NUMERIC,
ADD COLUMN IF NOT EXISTS fx_source_url TEXT,
ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS voyage_fixture TEXT,
ADD COLUMN IF NOT EXISTS cost_center TEXT,
ADD COLUMN IF NOT EXISTS gl_account TEXT,
ADD COLUMN IF NOT EXISTS billing_class TEXT,
ADD COLUMN IF NOT EXISTS markup_pct NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_billable BOOLEAN DEFAULT true;

-- Enable RLS on new tables
ALTER TABLE public.fda_ledger_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fda_ledger_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for fda_ledger_payments (inherit from parent ledger line)
CREATE POLICY "Users can view payments for their own FDAs or admins can view all"
ON public.fda_ledger_payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM fda_ledger fl
    JOIN fda ON fda.id = fl.fda_id
    WHERE fl.id = fda_ledger_payments.ledger_id
    AND (fda.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Users can insert payments for their own FDAs or admins can insert any"
ON public.fda_ledger_payments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM fda_ledger fl
    JOIN fda ON fda.id = fl.fda_id
    WHERE fl.id = fda_ledger_payments.ledger_id
    AND (fda.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Users can update payments for their own FDAs or admins can update any"
ON public.fda_ledger_payments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM fda_ledger fl
    JOIN fda ON fda.id = fl.fda_id
    WHERE fl.id = fda_ledger_payments.ledger_id
    AND (fda.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Users can delete payments for their own FDAs or admins can delete any"
ON public.fda_ledger_payments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM fda_ledger fl
    JOIN fda ON fda.id = fl.fda_id
    WHERE fl.id = fda_ledger_payments.ledger_id
    AND (fda.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- RLS policies for fda_ledger_attachments
CREATE POLICY "Users can view attachments for their own FDAs or admins can view all"
ON public.fda_ledger_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM fda_ledger fl
    JOIN fda ON fda.id = fl.fda_id
    WHERE fl.id = fda_ledger_attachments.ledger_id
    AND (fda.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Users can insert attachments for their own FDAs or admins can insert any"
ON public.fda_ledger_attachments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM fda_ledger fl
    JOIN fda ON fda.id = fl.fda_id
    WHERE fl.id = fda_ledger_attachments.ledger_id
    AND (fda.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Users can delete attachments for their own FDAs or admins can delete any"
ON public.fda_ledger_attachments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM fda_ledger fl
    JOIN fda ON fda.id = fl.fda_id
    WHERE fl.id = fda_ledger_attachments.ledger_id
    AND (fda.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);