-- Update database structure for improved PDA handling
-- Ensure all numeric columns can handle decimal values properly
ALTER TABLE public.pdas 
ALTER COLUMN pilotage_in TYPE DECIMAL(15,2),
ALTER COLUMN towage_in TYPE DECIMAL(15,2),
ALTER COLUMN light_dues TYPE DECIMAL(15,2),
ALTER COLUMN dockage TYPE DECIMAL(15,2),
ALTER COLUMN linesman TYPE DECIMAL(15,2),
ALTER COLUMN launch_boat TYPE DECIMAL(15,2),
ALTER COLUMN immigration TYPE DECIMAL(15,2),
ALTER COLUMN free_pratique TYPE DECIMAL(15,2),
ALTER COLUMN shipping_association TYPE DECIMAL(15,2),
ALTER COLUMN clearance TYPE DECIMAL(15,2),
ALTER COLUMN paperless_port TYPE DECIMAL(15,2),
ALTER COLUMN agency_fee TYPE DECIMAL(15,2),
ALTER COLUMN waterway TYPE DECIMAL(15,2);

-- Add berths as JSON array column if it doesn't exist
ALTER TABLE public.pdas 
ADD COLUMN IF NOT EXISTS berths JSONB DEFAULT '[]'::jsonb;

-- Ensure proper defaults for critical fields
ALTER TABLE public.pdas 
ALTER COLUMN vessel_name SET DEFAULT '',
ALTER COLUMN port_name SET DEFAULT '',
ALTER COLUMN status SET DEFAULT 'CREATED';

-- Update existing records with old status to ensure compatibility
UPDATE public.pdas 
SET status = 'CREATED' 
WHERE status = 'IN_PROGRESS' AND status IS NOT NULL;