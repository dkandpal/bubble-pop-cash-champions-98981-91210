-- Drop existing policies if they exist to recreate them
DROP POLICY IF EXISTS "Anyone can view user profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can view games" ON public.public_games;
DROP POLICY IF EXISTS "Anyone can publish games" ON public.public_games;
DROP POLICY IF EXISTS "Users can update own games" ON public.public_games;
DROP POLICY IF EXISTS "Users can delete own games" ON public.public_games;

-- Create users table for profile information
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  email TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Anyone can view user profiles"
ON public.users FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own profile"
ON public.users FOR INSERT
WITH CHECK (auth.uid()::text = id);

-- Create public_games table
CREATE TABLE IF NOT EXISTS public.public_games (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  title TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  nsfw BOOLEAN DEFAULT FALSE,
  version TEXT NOT NULL,
  spec JSONB NOT NULL,
  user_id TEXT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  fork_of TEXT NULL REFERENCES public.public_games(id) ON DELETE SET NULL,
  view_count INTEGER DEFAULT 0,
  fork_count INTEGER DEFAULT 0,
  claim_token TEXT NULL,
  claimed_at TIMESTAMPTZ NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_public_games_user_id ON public.public_games(user_id);
CREATE INDEX IF NOT EXISTS idx_public_games_created_at ON public.public_games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_games_tags ON public.public_games USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_public_games_fork_of ON public.public_games(fork_of);
CREATE INDEX IF NOT EXISTS idx_public_games_claim_token ON public.public_games(claim_token) WHERE claim_token IS NOT NULL;

-- Enable RLS
ALTER TABLE public.public_games ENABLE ROW LEVEL SECURITY;

-- Public games policies
CREATE POLICY "Anyone can view games"
ON public.public_games FOR SELECT
USING (true);

CREATE POLICY "Anyone can publish games"
ON public.public_games FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own games"
ON public.public_games FOR UPDATE
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own games"
ON public.public_games FOR DELETE
USING (auth.uid()::text = user_id);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, photo_url)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Cleanup expired claim tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_claim_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.public_games
  SET claim_token = NULL
  WHERE claim_token IS NOT NULL
    AND claimed_at IS NULL
    AND created_at < NOW() - INTERVAL '10 minutes';
END;
$$;