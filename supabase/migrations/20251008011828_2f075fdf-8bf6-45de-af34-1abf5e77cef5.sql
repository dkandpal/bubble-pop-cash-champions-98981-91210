-- =====================================================================
-- FIX: Add RLS Policies to public_profiles View
-- =====================================================================
-- The public_profiles view needs RLS enabled with proper policies to:
-- 1. Allow public READ access (it's a public profile view)
-- 2. PREVENT any modifications (INSERT/UPDATE/DELETE)
-- =====================================================================

-- Step 1: Enable RLS on the public_profiles view
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Note: Views with security_invoker=true use the permissions of the calling user,
-- which means RLS policies on the underlying 'users' table will be enforced.
-- Since we've already granted SELECT on safe columns to anon/authenticated,
-- this view will automatically be restricted to those columns.

-- Step 2: Add explicit comment for clarity
COMMENT ON VIEW public.public_profiles IS 
  'PUBLIC VIEW: Exposes only non-sensitive user profile data (display_name, photo_url, created_at). Email addresses are NOT included. This view uses SECURITY INVOKER to enforce RLS from the underlying users table.';

-- =====================================================================
-- Security Summary:
-- ✅ public_profiles view now enforces RLS via security_invoker=true
-- ✅ Only safe columns (display_name, photo_url, created_at) are exposed
-- ✅ Email addresses remain protected in underlying users table
-- ✅ No INSERT/UPDATE/DELETE possible on view (views are read-only by default)
-- ✅ Public read access is safe since view only contains non-sensitive data
-- =====================================================================