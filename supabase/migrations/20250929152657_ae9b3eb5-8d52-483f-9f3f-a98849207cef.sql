-- Add platformAdmin role to the app_role enum
ALTER TYPE public.app_role ADD VALUE 'platformAdmin';

-- Create a function to setup demo admin account
CREATE OR REPLACE FUNCTION public.setup_demo_admin(
  admin_email TEXT,
  admin_password TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
  user_exists BOOLEAN;
  result json;
BEGIN
  -- Check if demo admin already exists in auth.users
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE email = admin_email
  ) INTO user_exists;

  IF NOT user_exists THEN
    -- Create the admin user via Supabase Auth (this will be done via Edge Function)
    result := json_build_object(
      'status', 'needs_creation',
      'message', 'Demo admin user needs to be created via auth'
    );
  ELSE
    -- Get the user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = admin_email;

    -- Ensure email is verified
    UPDATE auth.users 
    SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = admin_user_id;

    -- Ensure platformAdmin role exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'platformAdmin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Remove other roles for this user
    DELETE FROM public.user_roles 
    WHERE user_id = admin_user_id AND role != 'platformAdmin';

    result := json_build_object(
      'status', 'success',
      'message', 'Demo admin configured successfully'
    );
  END IF;

  RETURN result;
END;
$$;