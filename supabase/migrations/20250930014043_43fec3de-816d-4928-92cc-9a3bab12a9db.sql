-- Verificar se trigger existe e criar se necessário
DO $$
BEGIN
  -- Verificar se a função existe
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_owner_membership') THEN
    -- Function to auto-create owner membership when company is created
    EXECUTE 'CREATE OR REPLACE FUNCTION public.create_owner_membership()
    RETURNS TRIGGER AS $FUNC$
    BEGIN
      -- Create owner membership for the user who created the organization
      IF NEW.owner_user_id IS NOT NULL THEN
        INSERT INTO public.memberships (user_id, company_id, role)
        VALUES (NEW.owner_user_id, NEW.id, ''owner'')
        ON CONFLICT (user_id, company_id) DO UPDATE SET role = ''owner'';
      END IF;
      
      RETURN NEW;
    END;
    $FUNC$ LANGUAGE plpgsql SECURITY DEFINER;';
  END IF;
  
  -- Verificar se o trigger existe
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_create_owner_membership') THEN
    -- Trigger to create owner membership
    EXECUTE 'CREATE TRIGGER trigger_create_owner_membership
      AFTER INSERT ON public.organizations
      FOR EACH ROW
      EXECUTE FUNCTION public.create_owner_membership();';
  END IF;
END $$;

-- Verificar se os índices existem
CREATE INDEX IF NOT EXISTS idx_memberships_company_id ON public.memberships(company_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_company_id ON public.invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);