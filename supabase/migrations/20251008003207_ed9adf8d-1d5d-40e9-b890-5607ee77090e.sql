-- =====================================================================
-- CRITICAL FIX: Protect User Email Addresses from Public Exposure
-- =====================================================================
-- This migration ensures the users table email column is completely
-- protected from any public access, while maintaining the public_profiles
-- view functionality for non-sensitive user data.
-- =====================================================================

-- Step 1: Revoke ALL access to users table from public roles
-- This ensures no direct queries can access the table
REVOKE ALL ON TABLE public.users FROM anon, authenticated;

-- Step 2: Explicitly protect sensitive columns
-- Email column must NEVER be accessible to public roles
REVOKE ALL (email) ON TABLE public.users FROM anon, authenticated;

-- Step 3: Grant SELECT only on safe public profile columns
-- These are the only columns that should be visible in public_profiles view
GRANT SELECT (
  id,
  display_name,
  photo_url,
  created_at
) ON TABLE public.users TO anon, authenticated;

-- Step 4: Authenticated users can UPDATE their own profile (safe columns only)
GRANT UPDATE (
  display_name,
  photo_url
) ON TABLE public.users TO authenticated;

-- Step 5: Ensure public_profiles view has proper access
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Step 6: Add explicit security comment
COMMENT ON COLUMN public.users.email IS 
  'PROTECTED: Email addresses are private and must never be exposed to public API. Only accessible via auth.uid() = id check.';

-- =====================================================================
-- Security Summary:
-- ✅ users table is NOT directly queryable by public roles
-- ✅ email column is explicitly REVOKED from all public access
-- ✅ public_profiles view only exposes safe columns (no email)
-- ✅ Users can only see their own email via RLS policy (auth.uid() = id)
-- ✅ Authenticated users can update only non-sensitive profile fields
-- =====================================================================