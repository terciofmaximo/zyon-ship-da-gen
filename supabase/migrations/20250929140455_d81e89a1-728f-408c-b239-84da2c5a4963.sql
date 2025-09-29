-- Drop the existing hardcoded tenant policy
DROP POLICY IF EXISTS "Allow access for mock tenant" ON public.pdas;

-- Create new RLS policies based on authenticated users
-- Users can only access their own PDAs where tenant_id equals their auth.uid()
CREATE POLICY "Users can view their own PDAs" 
ON public.pdas 
FOR SELECT 
TO authenticated
USING (tenant_id = auth.uid());

CREATE POLICY "Users can create their own PDAs" 
ON public.pdas 
FOR INSERT 
TO authenticated
WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update their own PDAs" 
ON public.pdas 
FOR UPDATE 
TO authenticated
USING (tenant_id = auth.uid())
WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can delete their own PDAs" 
ON public.pdas 
FOR DELETE 
TO authenticated
USING (tenant_id = auth.uid());