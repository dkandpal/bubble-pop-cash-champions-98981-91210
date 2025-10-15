-- Fix users table RLS policies to be explicit and non-conflicting
-- Remove the confusing "Block all public access to users" ALL policy
DROP POLICY IF EXISTS "Block all public access to users" ON public.users;

-- Add explicit public SELECT policy that denies all unauthenticated access
CREATE POLICY "Public cannot read users table"
ON public.users
FOR SELECT
TO anon
USING (false);

-- The existing "Users can view own complete profile" policy already handles
-- authenticated users seeing their own data, so we don't need to add another one

-- Add a comment to document the security model
COMMENT ON TABLE public.users IS 'Contains user profile data including emails. RLS ensures: (1) Public/anonymous users cannot read any data, (2) Authenticated users can only read their own profile, (3) Only system triggers can insert, (4) Users can update their own profile, (5) No direct deletions allowed.';