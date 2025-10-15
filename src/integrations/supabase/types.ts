export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      entries: {
        Row: {
          accuracy: number | null
          bubbles_popped: number | null
          client_session_id: string
          duration_ms: number
          game_key: string
          id: string
          match_id: string | null
          max_combo: number | null
          metadata: Json | null
          player_id: string
          rules_version: string
          score: number
          status: string
          submitted_at: string
        }
        Insert: {
          accuracy?: number | null
          bubbles_popped?: number | null
          client_session_id: string
          duration_ms: number
          game_key: string
          id?: string
          match_id?: string | null
          max_combo?: number | null
          metadata?: Json | null
          player_id: string
          rules_version: string
          score: number
          status: string
          submitted_at?: string
        }
        Update: {
          accuracy?: number | null
          bubbles_popped?: number | null
          client_session_id?: string
          duration_ms?: number
          game_key?: string
          id?: string
          match_id?: string | null
          max_combo?: number | null
          metadata?: Json | null
          player_id?: string
          rules_version?: string
          score?: number
          status?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entries_game_key_rules_version_fkey"
            columns: ["game_key", "rules_version"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["game_key", "rules_version"]
          },
          {
            foreignKeyName: "entries_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string
          description: string | null
          game_key: string
          rules_version: string
          settings: Json
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          game_key: string
          rules_version: string
          settings: Json
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          game_key?: string
          rules_version?: string
          settings?: Json
          title?: string
        }
        Relationships: []
      }
      match_results: {
        Row: {
          created_at: string
          entry_a_id: string
          entry_b_id: string
          match_id: string
          outcome: string
          score_a: number
          score_b: number
          winner_entry_id: string | null
        }
        Insert: {
          created_at?: string
          entry_a_id: string
          entry_b_id: string
          match_id: string
          outcome: string
          score_a: number
          score_b: number
          winner_entry_id?: string | null
        }
        Update: {
          created_at?: string
          entry_a_id?: string
          entry_b_id?: string
          match_id?: string
          outcome?: string
          score_a?: number
          score_b?: number
          winner_entry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_results_entry_a_id_fkey"
            columns: ["entry_a_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_entry_b_id_fkey"
            columns: ["entry_b_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_winner_entry_id_fkey"
            columns: ["winner_entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          completed_at: string | null
          created_at: string
          expires_at: string | null
          game_key: string
          id: string
          rules_version: string
          state: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          game_key: string
          id?: string
          rules_version: string
          state: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          game_key?: string
          id?: string
          rules_version?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_game_key_rules_version_fkey"
            columns: ["game_key", "rules_version"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["game_key", "rules_version"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          handle: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          handle?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          handle?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      public_games: {
        Row: {
          created_at: string
          fork_count: number | null
          fork_of: string | null
          id: string
          nsfw: boolean | null
          spec: Json
          tagline: string | null
          tags: string[] | null
          title: string
          user_id: string
          version: string
          view_count: number | null
        }
        Insert: {
          created_at?: string
          fork_count?: number | null
          fork_of?: string | null
          id?: string
          nsfw?: boolean | null
          spec: Json
          tagline?: string | null
          tags?: string[] | null
          title: string
          user_id: string
          version: string
          view_count?: number | null
        }
        Update: {
          created_at?: string
          fork_count?: number | null
          fork_of?: string | null
          id?: string
          nsfw?: boolean | null
          spec?: Json
          tagline?: string | null
          tags?: string[] | null
          title?: string
          user_id?: string
          version?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_public_games_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_games_fork_of_fkey"
            columns: ["fork_of"]
            isOneToOne: false
            referencedRelation: "public_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          photo_url: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          photo_url?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          photo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          photo_url: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          photo_url?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          photo_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_claim_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_game_public: {
        Args: { game_id: string }
        Returns: {
          created_at: string
          fork_count: number
          fork_of: string
          id: string
          nsfw: boolean
          spec: Json
          tagline: string
          tags: string[]
          title: string
          user_id: string
          version: string
          view_count: number
        }[]
      }
      get_public_profile: {
        Args: { profile_user_id: string }
        Returns: {
          created_at: string
          display_name: string
          id: string
          photo_url: string
        }[]
      }
      get_public_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          display_name: string
          id: string
          photo_url: string
        }[]
      }
      increment_game_fork_count: {
        Args: { game_id: string }
        Returns: undefined
      }
      increment_game_view_count: {
        Args: { game_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
