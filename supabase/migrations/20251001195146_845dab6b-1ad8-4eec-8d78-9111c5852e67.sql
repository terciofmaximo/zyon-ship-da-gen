
-- Set default tenant for super admin user
UPDATE public.user_profiles
SET tenant_id = '02f6b130-f09a-4c06-aed0-35f885b91832',
    updated_at = now()
WHERE user_id = 'b4d2efb5-8c1f-4584-95b8-896016068443';
