-- Soft migration: Backfill domain for existing companies
-- Try to infer domain from oldest owner's email

-- Update companies without domain by inferring from owner's email
UPDATE public.organizations org
SET domain = LOWER(SPLIT_PART(u.email, '@', 2))
FROM auth.users u
WHERE org.domain IS NULL
  AND org.owner_user_id IS NOT NULL
  AND org.owner_user_id = u.id
  AND SPLIT_PART(u.email, '@', 2) NOT IN (
    'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 
    'icloud.com', 'bol.com.br', 'uol.com.br', 'aol.com', 
    'protonmail.com', 'mail.com'
  );

-- Mark all pending organization invitations as expired (soft cleanup)
UPDATE public.organization_invites
SET expires_at = now() - INTERVAL '1 day'
WHERE accepted_at IS NULL
  AND expires_at > now();

-- Mark all pending company invitations as expired (soft cleanup)
UPDATE public.invitations
SET status = 'expired'
WHERE status = 'pending'
  AND expires_at > now();