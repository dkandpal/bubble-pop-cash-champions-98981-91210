import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get player_id from user
    const { data: player } = await supabaseClient
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!player) {
      throw new Error('Player not found');
    }

    const player_id = player.id;

    const body = await req.json();
    const { game_key, limit = 50 } = body;

    // Build query
    let query = supabaseClient
      .from('entries')
      .select(`
        id,
        match_id,
        score,
        submitted_at,
        game_key,
        matches!inner (
          id,
          state,
          completed_at
        )
      `)
      .eq('player_id', player_id)
      .not('match_id', 'is', null)
      .order('submitted_at', { ascending: false })
      .limit(limit);

    if (game_key) {
      query = query.eq('game_key', game_key);
    }

    const { data: entries, error } = await query;

    if (error) throw error;

    // Fetch match results for each entry
    const history = await Promise.all(
      entries.map(async (entry: any) => {
        // Get game title
        const { data: game } = await supabaseClient
          .from('games')
          .select('title')
          .eq('game_key', entry.game_key)
          .single();

        const { data: result } = await supabaseClient
          .from('match_results')
          .select('*')
          .eq('match_id', entry.match_id)
          .single();

        if (!result) return null;

        // Determine if this player was entry_a or entry_b
        const isEntryA = result.entry_a_id === entry.id;
        const yourScore = isEntryA ? result.score_a : result.score_b;
        const opponentScore = isEntryA ? result.score_b : result.score_a;
        const opponentEntryId = isEntryA ? result.entry_b_id : result.entry_a_id;

        // Get opponent's entry to find their player_id
        const { data: opponentEntry } = await supabaseClient
          .from('entries')
          .select('player_id')
          .eq('id', opponentEntryId)
          .single();

        // Get opponent's handle from players table
        let opponentHandle = 'Anonymous Player';
        if (opponentEntry?.player_id) {
          const { data: opponentPlayer } = await supabaseClient
            .from('players')
            .select('handle')
            .eq('id', opponentEntry.player_id)
            .single();
          
          opponentHandle = opponentPlayer?.handle || 'Anonymous Player';
        }

        let outcome: 'win' | 'loss' | 'tie' | 'canceled';
        if (result.outcome === 'canceled') {
          outcome = 'canceled';
        } else if (result.outcome === 'tie') {
          outcome = 'tie';
        } else if (result.winner_entry_id === entry.id) {
          outcome = 'win';
        } else {
          outcome = 'loss';
        }

        return {
          match_id: entry.match_id,
          opponent_handle: opponentHandle || 'Anonymous Player',
          your_score: yourScore,
          opponent_score: opponentScore,
          outcome,
          game_title: game?.title || 'Bubble Shooter',
          completed_at: entry.matches.completed_at || entry.submitted_at
        };
      })
    );

    return new Response(JSON.stringify({
      history: history.filter(h => h !== null)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
