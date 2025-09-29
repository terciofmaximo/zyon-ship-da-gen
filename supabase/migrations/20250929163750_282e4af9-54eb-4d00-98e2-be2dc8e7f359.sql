-- Create FDA status enum
CREATE TYPE public.fda_status AS ENUM ('Draft', 'Posted', 'Closed');

-- Create FDA ledger side enum  
CREATE TYPE public.fda_ledger_side AS ENUM ('AP', 'AR');

-- Create FDA ledger status enum
CREATE TYPE public.fda_ledger_status AS ENUM ('Open', 'Settled', 'Partially Settled');

-- Create FDA table
CREATE TABLE public.fda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pda_id UUID NOT NULL,
  status fda_status NOT NULL DEFAULT 'Draft',
  client_name TEXT,
  client_id TEXT,
  vessel_name TEXT,
  imo TEXT,
  port TEXT,
  terminal TEXT,
  currency_base TEXT NOT NULL DEFAULT 'USD',
  currency_local TEXT NOT NULL DEFAULT 'BRL', 
  exchange_rate DECIMAL(18,6),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  meta JSONB
);

-- Create FDA ledger table
CREATE TABLE public.fda_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fda_id UUID NOT NULL REFERENCES public.fda(id) ON DELETE CASCADE,
  line_no INTEGER NOT NULL,
  side fda_ledger_side NOT NULL,
  category TEXT,
  description TEXT,
  counterparty TEXT,
  amount_usd DECIMAL(18,2),
  amount_local DECIMAL(18,2),
  invoice_no TEXT,
  due_date DATE,
  status fda_ledger_status NOT NULL DEFAULT 'Open',
  source JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on FDA table
ALTER TABLE public.fda ENABLE ROW LEVEL SECURITY;

-- Enable RLS on FDA ledger table
ALTER TABLE public.fda_ledger ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for FDA (similar to PDA policies)
CREATE POLICY "Users can view their own FDAs or admins can view all" 
ON public.fda 
FOR SELECT 
USING (
  (created_by = auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can create their own FDAs or admins can create any" 
ON public.fda 
FOR INSERT 
WITH CHECK (
  (created_by = auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can update their own FDAs or admins can update any" 
ON public.fda 
FOR UPDATE 
USING (
  (created_by = auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  (created_by = auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can delete their own FDAs or admins can delete any" 
ON public.fda 
FOR DELETE 
USING (
  (created_by = auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create RLS policies for FDA ledger (inherit from parent FDA)
CREATE POLICY "Users can view ledger for their own FDAs or admins can view all" 
ON public.fda_ledger 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.fda 
    WHERE fda.id = fda_ledger.fda_id 
    AND (
      (fda.created_by = auth.uid()) OR 
      has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

CREATE POLICY "Users can create ledger for their own FDAs or admins can create any" 
ON public.fda_ledger 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fda 
    WHERE fda.id = fda_ledger.fda_id 
    AND (
      (fda.created_by = auth.uid()) OR 
      has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

CREATE POLICY "Users can update ledger for their own FDAs or admins can update any" 
ON public.fda_ledger 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.fda 
    WHERE fda.id = fda_ledger.fda_id 
    AND (
      (fda.created_by = auth.uid()) OR 
      has_role(auth.uid(), 'admin'::app_role)
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fda 
    WHERE fda.id = fda_ledger.fda_id 
    AND (
      (fda.created_by = auth.uid()) OR 
      has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

CREATE POLICY "Users can delete ledger for their own FDAs or admins can delete any" 
ON public.fda_ledger 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.fda 
    WHERE fda.id = fda_ledger.fda_id 
    AND (
      (fda.created_by = auth.uid()) OR 
      has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

-- Add updated_at triggers
CREATE TRIGGER update_fda_updated_at
BEFORE UPDATE ON public.fda
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fda_ledger_updated_at
BEFORE UPDATE ON public.fda_ledger
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();