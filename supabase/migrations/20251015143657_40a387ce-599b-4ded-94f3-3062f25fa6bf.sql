-- Create players table
CREATE TABLE public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  handle text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create games table (competitive game definitions)
CREATE TABLE public.games (
  game_key text NOT NULL,
  rules_version text NOT NULL,
  title text NOT NULL,
  description text,
  settings jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (game_key, rules_version)
);

-- Create matches table
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_key text NOT NULL,
  rules_version text NOT NULL,
  state text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  expires_at timestamptz,
  FOREIGN KEY (game_key, rules_version) REFERENCES public.games(game_key, rules_version)
);

-- Add validation trigger for match state
CREATE OR REPLACE FUNCTION validate_match_state()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.state NOT IN ('open', 'completed', 'canceled') THEN
    RAISE EXCEPTION 'Invalid match state: %', NEW.state;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_match_state
  BEFORE INSERT OR UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION validate_match_state();

-- Create index for matchmaking
CREATE INDEX idx_matches_matchmaking ON public.matches(game_key, rules_version, state, created_at);

-- Create entries table
CREATE TABLE public.entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  game_key text NOT NULL,
  rules_version text NOT NULL,
  client_session_id text NOT NULL,
  score integer NOT NULL,
  duration_ms integer NOT NULL,
  accuracy decimal(5,2),
  max_combo integer,
  bubbles_popped integer,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL,
  metadata jsonb,
  UNIQUE(player_id, client_session_id),
  FOREIGN KEY (game_key, rules_version) REFERENCES public.games(game_key, rules_version)
);

-- Add validation triggers for entries
CREATE OR REPLACE FUNCTION validate_entry_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'committed') THEN
    RAISE EXCEPTION 'Invalid entry status: %', NEW.status;
  END IF;
  IF NEW.score < 0 THEN
    RAISE EXCEPTION 'Score cannot be negative';
  END IF;
  IF NEW.duration_ms <= 0 THEN
    RAISE EXCEPTION 'Duration must be positive';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_entry_status
  BEFORE INSERT OR UPDATE ON public.entries
  FOR EACH ROW
  EXECUTE FUNCTION validate_entry_status();

-- Create indexes for matchmaking and history
CREATE INDEX idx_entries_matchmaking ON public.entries(game_key, rules_version, status, submitted_at);
CREATE INDEX idx_entries_player ON public.entries(player_id, submitted_at DESC);

-- Create match_results table
CREATE TABLE public.match_results (
  match_id uuid PRIMARY KEY REFERENCES public.matches(id) ON DELETE CASCADE,
  entry_a_id uuid NOT NULL REFERENCES public.entries(id),
  entry_b_id uuid NOT NULL REFERENCES public.entries(id),
  winner_entry_id uuid REFERENCES public.entries(id),
  score_a integer NOT NULL,
  score_b integer NOT NULL,
  outcome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add validation trigger for match_results outcome
CREATE OR REPLACE FUNCTION validate_match_outcome()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.outcome NOT IN ('a_won', 'b_won', 'tie', 'canceled') THEN
    RAISE EXCEPTION 'Invalid outcome: %', NEW.outcome;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_match_outcome
  BEFORE INSERT OR UPDATE ON public.match_results
  FOR EACH ROW
  EXECUTE FUNCTION validate_match_outcome();

-- Enable Row Level Security
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for players table
CREATE POLICY "players_select_all" ON public.players
  FOR SELECT USING (true);

CREATE POLICY "players_insert_own" ON public.players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "players_update_own" ON public.players
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for games table
CREATE POLICY "games_select_all" ON public.games
  FOR SELECT USING (true);

-- RLS Policies for matches table
CREATE POLICY "matches_select_participant" ON public.matches
  FOR SELECT USING (
    id IN (
      SELECT match_id FROM public.entries 
      WHERE player_id IN (SELECT id FROM public.players WHERE user_id = auth.uid())
    )
  );

-- RLS Policies for entries table
CREATE POLICY "entries_select_own" ON public.entries
  FOR SELECT USING (
    player_id IN (SELECT id FROM public.players WHERE user_id = auth.uid())
  );

-- RLS Policies for match_results table
CREATE POLICY "results_select_participant" ON public.match_results
  FOR SELECT USING (
    match_id IN (
      SELECT match_id FROM public.entries 
      WHERE player_id IN (SELECT id FROM public.players WHERE user_id = auth.uid())
    )
  );

-- Enable pg_cron extension for automatic match expiration
CREATE EXTENSION IF NOT EXISTS pg_cron;