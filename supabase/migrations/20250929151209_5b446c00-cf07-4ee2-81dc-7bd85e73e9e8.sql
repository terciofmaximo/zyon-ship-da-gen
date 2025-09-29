-- Create admin user directly in the database (simplified approach)
-- This creates a mock admin entry that can be used to assign admin role

-- First, let's create a function to setup admin user that can be called
CREATE OR REPLACE FUNCTION public.setup_admin_user()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Check if we already have an admin user
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles WHERE role = 'admin'
    ) THEN
        -- Generate a UUID for the admin user that will be created via auth
        -- This UUID should match the one that will be created when admin@zyon.com signs up
        -- For now, we'll use a deterministic UUID based on the email
        admin_user_id := '00000000-0000-0000-0000-000000000001'::UUID;
        
        -- Insert the admin role entry (the user will be created via normal signup)
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Admin role setup completed. Admin user should sign up with email: admin@zyon.com';
    ELSE
        RAISE NOTICE 'Admin user already exists';
    END IF;
END;
$$;

-- Create a function that will be triggered when the admin user signs up
CREATE OR REPLACE FUNCTION public.handle_admin_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if this is the admin email
    IF NEW.email = 'admin@zyon.com' THEN
        -- Remove the default 'user' role that was just inserted
        DELETE FROM public.user_roles 
        WHERE user_id = NEW.id AND role = 'user';
        
        -- Add admin role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Admin role assigned to user: %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to handle admin signup
DROP TRIGGER IF EXISTS on_admin_user_created ON auth.users;
CREATE TRIGGER on_admin_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_admin_signup();