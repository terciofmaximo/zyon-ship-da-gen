-- Update RLS policies for PDAs to allow admin access
DROP POLICY IF EXISTS "Users can view their own PDAs" ON public.pdas;
DROP POLICY IF EXISTS "Users can create their own PDAs" ON public.pdas;
DROP POLICY IF EXISTS "Users can update their own PDAs" ON public.pdas;
DROP POLICY IF EXISTS "Users can delete their own PDAs" ON public.pdas;

-- Create new policies that allow both tenant access and admin access
CREATE POLICY "Users can view their own PDAs or admins can view all"
ON public.pdas
FOR SELECT
TO authenticated
USING (
  tenant_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can create their own PDAs or admins can create any"
ON public.pdas
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can update their own PDAs or admins can update any"
ON public.pdas
FOR UPDATE
TO authenticated
USING (
  tenant_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  tenant_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can delete their own PDAs or admins can delete any"
ON public.pdas
FOR DELETE
TO authenticated
USING (
  tenant_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin')
);