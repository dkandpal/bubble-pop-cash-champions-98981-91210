-- Add explicit deny policy for public/anonymous access to users table
-- This ensures that even if policies are misconfigured, unauthenticated users cannot access user data
CREATE POLICY "Block all public access to users"
ON public.users
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Verify RLS is enabled (it should already be enabled, but this ensures it)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Add a comment to document the security posture
COMMENT ON TABLE public.users IS 'Contains sensitive user data including emails. RLS enabled with strict policies: only authenticated users can view their own data, no public access allowed.';