-- Add new columns to FDA table for client payments and vessel schedule
-- client_paid_usd: Amount already paid by client (replaces percentage)
-- eta, etb, ets: Vessel schedule timestamps

ALTER TABLE public.fda
ADD COLUMN IF NOT EXISTS client_paid_usd numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS eta timestamp with time zone,
ADD COLUMN IF NOT EXISTS etb timestamp with time zone,
ADD COLUMN IF NOT EXISTS ets timestamp with time zone;