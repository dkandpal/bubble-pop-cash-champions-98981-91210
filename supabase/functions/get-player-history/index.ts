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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const body = await req.json();
    const { player_id, game_key, limit = 50 } = body;

    if (!player_id) {
      throw new Error('Missing player_id');
    }

    // Build query
    let query = supabase
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
        const { data: game } = await supabase
          .from('games')
          .select('title')
          .eq('game_key', entry.game_key)
          .single();

        const { data: result } = await supabase
          .from('match_results')
          .select(`
            *,
            entry_a:entries!match_results_entry_a_id_fkey(player:players(handle), score),
            entry_b:entries!match_results_entry_b_id_fkey(player:players(handle), score)
          `)
          .eq('match_id', entry.match_id)
          .single();

        if (!result) return null;

        // Determine if this player was entry_a or entry_b
        const isEntryA = result.entry_a_id === entry.id;
        const yourScore = isEntryA ? result.score_a : result.score_b;
        const opponentScore = isEntryA ? result.score_b : result.score_a;
        const opponentHandle = isEntryA ? result.entry_b?.player?.handle : result.entry_a?.player?.handle;

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
