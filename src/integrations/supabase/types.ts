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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          description: string
          icon: string
          id: string
          name: string
          points: number
          requirement: number
        }
        Insert: {
          description: string
          icon: string
          id?: string
          name: string
          points?: number
          requirement: number
        }
        Update: {
          description?: string
          icon?: string
          id?: string
          name?: string
          points?: number
          requirement?: number
        }
        Relationships: []
      }
      ai_analyses: {
        Row: {
          analysis_text: string
          completion_rate: number
          created_at: string
          habits_count: number
          id: string
        }
        Insert: {
          analysis_text: string
          completion_rate?: number
          created_at?: string
          habits_count?: number
          id?: string
        }
        Update: {
          analysis_text?: string
          completion_rate?: number
          created_at?: string
          habits_count?: number
          id?: string
        }
        Relationships: []
      }
      custom_quotes: {
        Row: {
          author: string
          category: string
          created_at: string
          id: string
          is_active: boolean
          is_favorite: boolean
          text: string
          updated_at: string
        }
        Insert: {
          author: string
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_favorite?: boolean
          text: string
          updated_at?: string
        }
        Update: {
          author?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_favorite?: boolean
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string
          current_count: number
          description: string | null
          end_date: string
          goal_type: string
          id: string
          is_completed: boolean
          reward_points: number
          start_date: string
          target_count: number
          title: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          current_count?: number
          description?: string | null
          end_date: string
          goal_type: string
          id?: string
          is_completed?: boolean
          reward_points?: number
          start_date?: string
          target_count: number
          title: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          current_count?: number
          description?: string | null
          end_date?: string
          goal_type?: string
          id?: string
          is_completed?: boolean
          reward_points?: number
          start_date?: string
          target_count?: number
          title?: string
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          completed_at: string
          habit_id: string
          id: string
          notes: string | null
        }
        Insert: {
          completed_at?: string
          habit_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          completed_at?: string
          habit_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          category: string
          color: string
          created_at: string
          description: string | null
          id: string
          is_archived: boolean
          preferred_time: string | null
          reminder_enabled: boolean | null
          reminder_time: string | null
          streak: number
          title: string
        }
        Insert: {
          category: string
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          preferred_time?: string | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          streak?: number
          title: string
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          preferred_time?: string | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          streak?: number
          title?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profile: {
        Row: {
          display_name: string
          id: string
          level: number
          total_points: number
        }
        Insert: {
          display_name?: string
          id?: string
          level?: number
          total_points?: number
        }
        Update: {
          display_name?: string
          id?: string
          level?: number
          total_points?: number
        }
        Relationships: []
      }
      wake_up_logs: {
        Row: {
          actual_time: string | null
          created_at: string
          id: string
          notes: string | null
          target_time: string
          wake_date: string
          woke_up: boolean
        }
        Insert: {
          actual_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          target_time?: string
          wake_date: string
          woke_up?: boolean
        }
        Update: {
          actual_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          target_time?: string
          wake_date?: string
          woke_up?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
