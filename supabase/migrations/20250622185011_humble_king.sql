/*
  # Fix user signup database error

  1. Database Issue
    - The signup process fails because there's no automatic user profile creation
    - Need to create a trigger that automatically creates a user_profiles record when a new user signs up

  2. Solution
    - Create/update the create_user_profile function
    - Add a trigger on auth.users to automatically create user profiles
    - Ensure proper permissions for the auth schema to insert into user_profiles

  3. Security
    - The trigger will run with elevated privileges to bypass RLS
    - User profiles will be created with default student role
*/

-- Create or replace the function to create user profiles
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    'student'::user_role,
    true
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;

-- Create the trigger on auth.users
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_profile();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT INSERT ON public.user_profiles TO supabase_auth_admin;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;

-- Ensure the function can be executed by the auth system
GRANT EXECUTE ON FUNCTION public.create_user_profile() TO supabase_auth_admin;