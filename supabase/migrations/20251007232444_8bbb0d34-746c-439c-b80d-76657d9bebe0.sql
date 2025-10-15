-- Add explicit policy to deny anonymous access to users table
-- This provides defense-in-depth to ensure email addresses are never exposed to unauthenticated users

-- Add a restrictive policy requiring authentication for any SELECT on users table
-- This will be AND'd with the existing "Users can view own complete profile" policy
CREATE POLICY "Require authentication for user data access"
  ON public.users
  AS RESTRICTIVE
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Add comment explaining the security model
COMMENT ON POLICY "Require authentication for user data access" ON public.users IS 
'Explicitly denies anonymous/public access to the users table to protect email addresses. This policy works in conjunction with "Users can view own complete profile" to ensure: (1) users must be authenticated, and (2) users can only see their own data.';