-- Add new status values to pda_status enum
ALTER TYPE public.pda_status ADD VALUE IF NOT EXISTS 'CREATED';

-- Commit the transaction so the new enum value can be used