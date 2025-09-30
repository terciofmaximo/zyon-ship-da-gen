-- Fix security warnings by adding search_path to new functions
CREATE OR REPLACE FUNCTION generate_tracking_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION set_tracking_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tracking_id IS NULL THEN
    NEW.tracking_id := generate_tracking_id();
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.pdas WHERE tracking_id = NEW.tracking_id) LOOP
      NEW.tracking_id := generate_tracking_id();
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;