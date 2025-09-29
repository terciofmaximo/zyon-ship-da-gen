-- Create organization_invites table
CREATE TABLE public.organization_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer',
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

-- Invites visible only to org admins of that org and platformAdmin
CREATE POLICY "Org admins can view invites"
ON public.organization_invites
FOR SELECT
USING (
  public.is_org_admin(auth.uid(), org_id)
  OR public.has_role(auth.uid(), 'platformAdmin'::app_role)
);

-- Org admins can create invites
CREATE POLICY "Org admins can create invites"
ON public.organization_invites
FOR INSERT
WITH CHECK (
  public.is_org_admin(auth.uid(), org_id)
  OR public.has_role(auth.uid(), 'platformAdmin'::app_role)
);

-- Org admins can update invites (for marking as accepted)
CREATE POLICY "Org admins can update invites"
ON public.organization_invites
FOR UPDATE
USING (
  public.is_org_admin(auth.uid(), org_id)
  OR public.has_role(auth.uid(), 'platformAdmin'::app_role)
);

-- Anyone can view their own invite by token (for acceptance page)
CREATE POLICY "Anyone can view invite by token"
ON public.organization_invites
FOR SELECT
USING (true);

-- Create index for token lookups
CREATE INDEX idx_organization_invites_token ON public.organization_invites(token);
CREATE INDEX idx_organization_invites_org_id ON public.organization_invites(org_id);
CREATE INDEX idx_organization_invites_email ON public.organization_invites(email);