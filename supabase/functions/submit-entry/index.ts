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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const body = await req.json();
    const {
      player_id,
      game_key,
      rules_version,
      client_session_id,
      score,
      duration_ms,
      accuracy,
      max_combo,
      bubbles_popped,
      metadata
    } = body;

    console.log('Submit entry request:', { player_id, game_key, rules_version, score });

    // Upsert game record
    const { error: gameError } = await supabase
      .from('games')
      .upsert({
        game_key,
        rules_version,
        title: body.game_title || 'Bubble Shooter',
        settings: { timeLimit: 120, gridCols: 10, gridRows: 12 }
      }, {
        onConflict: 'game_key,rules_version'
      });

    if (gameError) throw gameError;

    // Check for existing entry (idempotency)
    const { data: existingEntry } = await supabase
      .from('entries')
      .select('id, match_id, status')
      .eq('player_id', player_id)
      .eq('client_session_id', client_session_id)
      .single();

    if (existingEntry) {
      console.log('Duplicate submission detected, returning existing match');
      
      if (existingEntry.match_id) {
        const { data: match } = await supabase
          .from('matches')
          .select('state')
          .eq('id', existingEntry.match_id)
          .single();

        if (match?.state === 'completed') {
          const { data: results } = await supabase
            .from('match_results')
            .select(`
              *,
              entry_a:entries!match_results_entry_a_id_fkey(player:players(handle)),
              entry_b:entries!match_results_entry_b_id_fkey(player:players(handle))
            `)
            .eq('match_id', existingEntry.match_id)
            .single();

          return new Response(JSON.stringify({
            state: 'completed',
            match_id: existingEntry.match_id,
            results: {
              ...results,
              player_a_handle: results.entry_a?.player?.handle,
              player_b_handle: results.entry_b?.player?.handle
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          state: 'waiting',
          match_id: existingEntry.match_id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Insert new entry
    const { data: newEntry, error: entryError } = await supabase
      .from('entries')
      .insert({
        player_id,
        game_key,
        rules_version,
        client_session_id,
        score,
        duration_ms,
        accuracy,
        max_combo,
        bubbles_popped,
        status: 'pending',
        metadata
      })
      .select()
      .single();

    if (entryError) throw entryError;

    console.log('New entry created:', newEntry.id);

    // Matchmaking: find pending opponent
    const { data: opponentEntry } = await supabase
      .from('entries')
      .select('*')
      .eq('game_key', game_key)
      .eq('rules_version', rules_version)
      .eq('status', 'pending')
      .neq('player_id', player_id)
      .is('match_id', null)
      .gte('submitted_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .order('submitted_at', { ascending: true })
      .limit(1)
      .single();

    if (opponentEntry) {
      console.log('Opponent found, creating match');

      // Create completed match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
          game_key,
          rules_version,
          state: 'completed',
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // Update both entries
      await supabase
        .from('entries')
        .update({ match_id: match.id, status: 'committed' })
        .in('id', [newEntry.id, opponentEntry.id]);

      // Determine winner
      let winner_entry_id = null;
      let outcome = 'tie';
      
      if (newEntry.score > opponentEntry.score) {
        winner_entry_id = newEntry.id;
        outcome = 'a_won';
      } else if (opponentEntry.score > newEntry.score) {
        winner_entry_id = opponentEntry.id;
        outcome = 'b_won';
      }

      // Create match results
      const { data: results, error: resultsError } = await supabase
        .from('match_results')
        .insert({
          match_id: match.id,
          entry_a_id: opponentEntry.id,
          entry_b_id: newEntry.id,
          winner_entry_id,
          score_a: opponentEntry.score,
          score_b: newEntry.score,
          outcome
        })
        .select(`
          *,
          entry_a:entries!match_results_entry_a_id_fkey(player:players(handle)),
          entry_b:entries!match_results_entry_b_id_fkey(player:players(handle))
        `)
        .single();

      if (resultsError) throw resultsError;

      console.log('Match completed:', match.id);

      return new Response(JSON.stringify({
        state: 'completed',
        match_id: match.id,
        results: {
          ...results,
          player_a_handle: results.entry_a?.player?.handle,
          player_b_handle: results.entry_b?.player?.handle
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // No opponent found, create open match
    console.log('No opponent found, creating open match');

    const { data: openMatch, error: openMatchError } = await supabase
      .from('matches')
      .insert({
        game_key,
        rules_version,
        state: 'open',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (openMatchError) throw openMatchError;

    // Update entry with match_id
    await supabase
      .from('entries')
      .update({ match_id: openMatch.id, status: 'committed' })
      .eq('id', newEntry.id);

    return new Response(JSON.stringify({
      state: 'waiting',
      match_id: openMatch.id
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
