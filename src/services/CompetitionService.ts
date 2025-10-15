import { supabase } from "@/integrations/supabase/client";
import { GameStats } from "@/types/game";
import { GameConfig } from "@/config/gameConfig";

export interface MatchResponse {
  state: "waiting" | "completed";
  match_id: string;
  results?: MatchResults;
}

export interface MatchResults {
  entry_a_id: string;
  entry_b_id: string;
  player_a_handle: string | null;
  player_b_handle: string | null;
  score_a: number;
  score_b: number;
  winner_entry_id: string | null;
  outcome: "a_won" | "b_won" | "tie" | "canceled";
  completed_at: string;
}

export interface MatchStatusResponse {
  state: "open" | "completed" | "canceled";
  expires_at?: string;
  results?: MatchResults;
}

export interface MatchHistoryItem {
  match_id: string;
  opponent_handle: string | null;
  your_score: number;
  opponent_score: number;
  outcome: "win" | "loss" | "tie" | "canceled";
  game_title: string;
  completed_at: string;
}

export interface HistoryFilters {
  game_key?: string;
  limit?: number;
  cursor?: string;
}

export class CompetitionService {
  /**
   * Ensure player record exists for current user
   */
  async ensurePlayerRecord(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Check if player exists
    const { data: existingPlayer } = await supabase
      .from("players")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existingPlayer) {
      return existingPlayer.id;
    }

    // Create player record
    const { data: newPlayer, error } = await supabase
      .from("players")
      .insert({
        user_id: user.id,
        handle: user.email?.split("@")[0] || `Player_${user.id.slice(0, 8)}`
      })
      .select("id")
      .single();

    if (error) throw error;
    return newPlayer.id;
  }

  /**
   * Submit entry and get matched or enter waiting state
   */
  async submitEntry(stats: GameStats, clientSessionId: string): Promise<MatchResponse> {
    const playerId = await this.ensurePlayerRecord();

    const { data, error } = await supabase.functions.invoke("submit-entry", {
      body: {
        player_id: playerId,
        game_key: GameConfig.game_key,
        rules_version: GameConfig.rules_version,
        client_session_id: clientSessionId,
        score: stats.score,
        duration_ms: stats.timeElapsed * 1000,
        accuracy: stats.accuracy,
        max_combo: stats.maxCombo,
        bubbles_popped: stats.bubblesPopped,
        metadata: {
          device: "web",
          build: new Date().toISOString()
        }
      }
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get current status of a match
   */
  async getMatchStatus(matchId: string): Promise<MatchStatusResponse> {
    const { data, error } = await supabase.functions.invoke("get-match-status", {
      body: { match_id: matchId }
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get player's match history
   */
  async getPlayerHistory(filters: HistoryFilters = {}): Promise<MatchHistoryItem[]> {
    const playerId = await this.ensurePlayerRecord();

    const { data, error } = await supabase.functions.invoke("get-player-history", {
      body: {
        player_id: playerId,
        game_key: filters.game_key,
        limit: filters.limit || 50,
        cursor: filters.cursor
      }
    });

    if (error) throw error;
    return data.history || [];
  }
}

export const competitionService = new CompetitionService();
