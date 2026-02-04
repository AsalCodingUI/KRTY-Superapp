-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    COALESCE((new.raw_user_meta_data->>'role')::public.app_role, 'employee'::public.app_role)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create a function to sync profile role changes to auth.users metadata
CREATE OR REPLACE FUNCTION public.sync_profile_role_to_metadata()
RETURNS trigger AS $$
BEGIN
  -- Update auth.users metadata when profile role changes
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', new.role)
  WHERE id = new.id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function when profile role is updated
DROP TRIGGER IF EXISTS on_profile_role_updated ON public.profiles;
CREATE TRIGGER on_profile_role_updated
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  WHEN (old.role IS DISTINCT FROM new.role)
  EXECUTE PROCEDURE public.sync_profile_role_to_metadata();

-- One-time sync for existing users (optional, run manually if needed)
-- UPDATE auth.users u
-- SET raw_user_meta_data = 
--   COALESCE(u.raw_user_meta_data, '{}'::jsonb) || 
--   jsonb_build_object('role', p.role)
-- FROM public.profiles p
-- WHERE u.id = p.id AND (u.raw_user_meta_data->>'role') IS DISTINCT FROM p.role::text;
