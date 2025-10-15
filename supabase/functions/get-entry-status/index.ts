import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { entry_id } = await req.json();

    if (!entry_id) {
      throw new Error('entry_id is required');
    }

    console.log(`Checking status for entry: ${entry_id}`);

    // Get entry details
    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .select('id, match_id, status')
      .eq('id', entry_id)
      .single();

    if (entryError || !entry) {
      console.error('Entry not found:', entryError);
      throw new Error('Entry not found');
    }

    // If entry has no match_id, still waiting
    if (!entry.match_id) {
      console.log('Entry still waiting for opponent');
      return new Response(JSON.stringify({
        state: 'waiting',
        entry_id: entry.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Entry has been matched - get match details
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('state, expires_at, completed_at')
      .eq('id', entry.match_id)
      .single();

    if (matchError || !match) {
      console.error('Match not found:', matchError);
      throw new Error('Match not found');
    }

    // If match is completed, return results
    if (match.state === 'completed') {
      console.log('Match completed, fetching results');
      
      const { data: results, error: resultsError } = await supabase
        .from('match_results')
        .select(`
          entry_a_id,
          entry_b_id,
          score_a,
          score_b,
          winner_entry_id,
          outcome
        `)
        .eq('match_id', entry.match_id)
        .single();

      if (resultsError || !results) {
        console.error('Match results not found:', resultsError);
        throw new Error('Match results not found');
      }

      // Get player handles
      const { data: entryA } = await supabase
        .from('entries')
        .select('player_id')
        .eq('id', results.entry_a_id)
        .single();

      const { data: entryB } = await supabase
        .from('entries')
        .select('player_id')
        .eq('id', results.entry_b_id)
        .single();

      let playerAHandle = null;
      let playerBHandle = null;

      if (entryA) {
        const { data: playerA } = await supabase
          .from('players')
          .select('handle')
          .eq('id', entryA.player_id)
          .single();
        playerAHandle = playerA?.handle;
      }

      if (entryB) {
        const { data: playerB } = await supabase
          .from('players')
          .select('handle')
          .eq('id', entryB.player_id)
          .single();
        playerBHandle = playerB?.handle;
      }

      return new Response(JSON.stringify({
        state: 'completed',
        match_id: entry.match_id,
        results: {
          ...results,
          player_a_handle: playerAHandle,
          player_b_handle: playerBHandle,
          completed_at: match.completed_at
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Match is still open or canceled
    return new Response(JSON.stringify({
      state: match.state,
      match_id: entry.match_id,
      expires_at: match.expires_at
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
