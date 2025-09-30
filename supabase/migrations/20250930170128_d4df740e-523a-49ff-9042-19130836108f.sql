-- Create table to track PDA creation attempts for rate limiting
CREATE TABLE IF NOT EXISTS public.pda_creation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Index for efficient querying
CREATE INDEX idx_pda_attempts_session_time ON public.pda_creation_attempts(session_id, created_at);
CREATE INDEX idx_pda_attempts_ip_time ON public.pda_creation_attempts(ip_address, created_at);

-- Enable RLS
ALTER TABLE public.pda_creation_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (for tracking)
CREATE POLICY "Anyone can log creation attempts"
  ON public.pda_creation_attempts
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Only admins can view attempts
CREATE POLICY "Only admins can view attempts"
  ON public.pda_creation_attempts
  FOR SELECT
  TO public
  USING (has_role(auth.uid(), 'platformAdmin'::app_role));

-- Function to check rate limit before PDA creation
CREATE OR REPLACE FUNCTION public.check_pda_rate_limit(
  p_session_id TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_max_requests INTEGER DEFAULT 20,
  p_time_window_hours INTEGER DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_oldest_allowed TIMESTAMP WITH TIME ZONE;
BEGIN
  v_oldest_allowed := now() - (p_time_window_hours || ' hours')::INTERVAL;
  
  -- Count recent attempts by session_id
  SELECT COUNT(*)
  INTO v_count
  FROM public.pda_creation_attempts
  WHERE session_id = p_session_id
    AND created_at > v_oldest_allowed;
  
  -- If session limit exceeded, check IP as backup
  IF v_count >= p_max_requests AND p_ip_address IS NOT NULL THEN
    SELECT COUNT(*)
    INTO v_count
    FROM public.pda_creation_attempts
    WHERE ip_address = p_ip_address
      AND created_at > v_oldest_allowed;
      
    IF v_count >= p_max_requests THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'message', 'Rate limit exceeded. Please try again later.',
        'attempts', v_count,
        'limit', p_max_requests
      );
    END IF;
  ELSIF v_count >= p_max_requests THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'message', 'Rate limit exceeded. Please try again later.',
      'attempts', v_count,
      'limit', p_max_requests
    );
  END IF;
  
  -- Log this attempt
  INSERT INTO public.pda_creation_attempts (session_id, ip_address)
  VALUES (p_session_id, p_ip_address);
  
  -- Clean up old attempts (older than 24 hours)
  DELETE FROM public.pda_creation_attempts
  WHERE created_at < now() - INTERVAL '24 hours';
  
  RETURN jsonb_build_object(
    'allowed', true,
    'attempts', v_count + 1,
    'limit', p_max_requests
  );
END;
$$;