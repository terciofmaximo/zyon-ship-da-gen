-- Create enum for PDA status
CREATE TYPE public.pda_status AS ENUM ('IN_PROGRESS', 'SENT', 'APPROVED');

-- Create PDAs table
CREATE TABLE public.pdas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pda_number TEXT NOT NULL,
  tenant_id UUID NOT NULL,
  to_display_name TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  sent_by_user_id UUID,
  status pda_status NOT NULL DEFAULT 'IN_PROGRESS',
  
  -- Ship data fields
  vessel_name TEXT,
  imo_number TEXT,
  dwt TEXT,
  loa TEXT,
  beam TEXT,
  draft TEXT,
  port_name TEXT,
  berth TEXT,
  days_alongside TEXT,
  cargo TEXT,
  quantity TEXT,
  from_location TEXT,
  to_location TEXT,
  to_client_id TEXT,
  date_field TEXT,
  exchange_rate TEXT,
  exchange_rate_source TEXT,
  exchange_rate_source_url TEXT,
  exchange_rate_timestamp TEXT,
  
  -- Cost data fields
  pilotage_in DECIMAL(10,2) DEFAULT 0,
  towage_in DECIMAL(10,2) DEFAULT 0,
  light_dues DECIMAL(10,2) DEFAULT 0,
  dockage DECIMAL(10,2) DEFAULT 0,
  linesman DECIMAL(10,2) DEFAULT 0,
  launch_boat DECIMAL(10,2) DEFAULT 0,
  immigration DECIMAL(10,2) DEFAULT 0,
  free_pratique DECIMAL(10,2) DEFAULT 0,
  shipping_association DECIMAL(10,2) DEFAULT 0,
  clearance DECIMAL(10,2) DEFAULT 0,
  paperless_port DECIMAL(10,2) DEFAULT 0,
  agency_fee DECIMAL(10,2) DEFAULT 0,
  waterway DECIMAL(10,2) DEFAULT 0,
  
  -- Additional fields
  remarks TEXT,
  comments JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE (tenant_id, pda_number)
);

-- Enable RLS
ALTER TABLE public.pdas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view PDAs from their tenant" 
ON public.pdas 
FOR SELECT 
USING (tenant_id = auth.uid());

CREATE POLICY "Users can create PDAs for their tenant" 
ON public.pdas 
FOR INSERT 
WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update PDAs from their tenant" 
ON public.pdas 
FOR UPDATE 
USING (tenant_id = auth.uid());

CREATE POLICY "Users can delete PDAs from their tenant" 
ON public.pdas 
FOR DELETE 
USING (tenant_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_pdas_tenant_status_sent_at ON public.pdas (tenant_id, status, sent_at DESC);
CREATE INDEX idx_pdas_tenant_updated_at ON public.pdas (tenant_id, updated_at DESC);
CREATE INDEX idx_pdas_pda_number ON public.pdas (pda_number);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pdas_updated_at
BEFORE UPDATE ON public.pdas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate PDA number
CREATE OR REPLACE FUNCTION public.generate_pda_number(tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  sequence_num INTEGER;
  pda_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM now())::TEXT;
  
  -- Get the next sequence number for this tenant and year
  SELECT COALESCE(MAX(
    CASE 
      WHEN pda_number ~ ('^PDA-' || current_year || '-[0-9]+$') 
      THEN CAST(SUBSTRING(pda_number FROM '^PDA-' || current_year || '-([0-9]+)$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO sequence_num
  FROM public.pdas
  WHERE pdas.tenant_id = generate_pda_number.tenant_id;
  
  pda_number := 'PDA-' || current_year || '-' || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN pda_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;