-- Fix the overly permissive restrictive policy
-- The "Require authentication for user data access" policy only checked authentication
-- but didn't enforce that users can only see their own data

-- Drop the insufficiently restrictive policy
DROP POLICY IF EXISTS "Require authentication for user data access" ON public.users;

-- The existing "Users can view own complete profile" policy is sufficient:
-- - It implicitly requires authentication (auth.uid() must not be null to match id)
-- - It enforces ownership (auth.uid()::text = id)
-- This single policy provides complete protection for email addresses

-- Add comment to document why one policy is sufficient
COMMENT ON POLICY "Users can view own complete profile" ON public.users IS 
'Protects user email addresses by ensuring users can only view their own complete profile data. This policy implicitly requires authentication (auth.uid() returns null for anonymous users) and explicitly enforces ownership (auth.uid()::text = id), preventing any user from accessing other users'' email addresses.';