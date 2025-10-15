-- Drop the existing view
DROP VIEW IF EXISTS public.public_profiles CASCADE;

-- Create a real public_profiles table
CREATE TABLE IF NOT EXISTS public.public_profiles (
  id text PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  display_name text,
  photo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view public profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON public.public_profiles
FOR SELECT
TO public
USING (true);

-- Only allow system to insert (via trigger)
CREATE POLICY "System only profile inserts"
ON public.public_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.public_profiles
FOR UPDATE
TO authenticated
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- Block direct deletes (handled by CASCADE from users table)
CREATE POLICY "No direct profile deletes"
ON public.public_profiles
FOR DELETE
TO public
USING (false);

-- Update the handle_new_user function to also insert into public_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email, display_name, photo_url)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert into public_profiles table
  INSERT INTO public.public_profiles (id, display_name, photo_url)
  VALUES (
    NEW.id::text,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to keep public_profiles in sync when users table is updated
CREATE OR REPLACE FUNCTION public.sync_public_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update public_profiles when users display_name or photo_url changes
  UPDATE public.public_profiles
  SET 
    display_name = NEW.display_name,
    photo_url = NEW.photo_url
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_user_profile_updated
  AFTER UPDATE OF display_name, photo_url ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_public_profile();

-- Populate public_profiles with existing users
INSERT INTO public.public_profiles (id, display_name, photo_url, created_at)
SELECT id, display_name, photo_url, created_at
FROM public.users
ON CONFLICT (id) DO NOTHING;