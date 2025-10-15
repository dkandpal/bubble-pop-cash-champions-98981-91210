-- Add missing tagline column to public_games table
ALTER TABLE public.public_games 
ADD COLUMN IF NOT EXISTS tagline text;