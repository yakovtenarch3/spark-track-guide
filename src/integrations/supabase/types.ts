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
      ai_coach_conversations: {
        Row: {
          created_at: string
          id: string
          is_favorite: boolean
          messages: Json
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_favorite?: boolean
          messages?: Json
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_favorite?: boolean
          messages?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      alarms: {
        Row: {
          created_at: string
          days_of_week: number[] | null
          id: string
          is_active: boolean
          name: string
          ringtone_name: string | null
          ringtone_url: string | null
          snooze_enabled: boolean
          snooze_minutes: number
          time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          days_of_week?: number[] | null
          id?: string
          is_active?: boolean
          name?: string
          ringtone_name?: string | null
          ringtone_url?: string | null
          snooze_enabled?: boolean
          snooze_minutes?: number
          time?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          days_of_week?: number[] | null
          id?: string
          is_active?: boolean
          name?: string
          ringtone_name?: string | null
          ringtone_url?: string | null
          snooze_enabled?: boolean
          snooze_minutes?: number
          time?: string
          updated_at?: string
        }
        Relationships: []
      }
      book_bookmarks: {
        Row: {
          book_id: string
          created_at: string
          id: string
          tip_id: number
          title: string | null
        }
        Insert: {
          book_id?: string
          created_at?: string
          id?: string
          tip_id: number
          title?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          tip_id?: number
          title?: string | null
        }
        Relationships: []
      }
      book_notes: {
        Row: {
          book_id: string
          chapter: number | null
          created_at: string
          id: string
          is_favorite: boolean | null
          note_text: string
          note_type: string | null
          tip_id: number | null
          updated_at: string
        }
        Insert: {
          book_id?: string
          chapter?: number | null
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          note_text: string
          note_type?: string | null
          tip_id?: number | null
          updated_at?: string
        }
        Update: {
          book_id?: string
          chapter?: number | null
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          note_text?: string
          note_type?: string | null
          tip_id?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      book_progress: {
        Row: {
          book_id: string
          created_at: string
          current_chapter: number | null
          current_tip: number | null
          id: string
          last_read_at: string | null
        }
        Insert: {
          book_id?: string
          created_at?: string
          current_chapter?: number | null
          current_tip?: number | null
          id?: string
          last_read_at?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string
          current_chapter?: number | null
          current_tip?: number | null
          id?: string
          last_read_at?: string | null
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
      daily_goal_logs: {
        Row: {
          actual_value: string | null
          created_at: string
          goal_id: string
          id: string
          log_date: string
          notes: string | null
          succeeded: boolean
        }
        Insert: {
          actual_value?: string | null
          created_at?: string
          goal_id: string
          id?: string
          log_date: string
          notes?: string | null
          succeeded?: boolean
        }
        Update: {
          actual_value?: string | null
          created_at?: string
          goal_id?: string
          id?: string
          log_date?: string
          notes?: string | null
          succeeded?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "daily_goal_logs_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "daily_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_goals: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          reminder_enabled: boolean
          reminder_time: string | null
          target_unit: string | null
          target_value: string | null
          title: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          reminder_enabled?: boolean
          reminder_time?: string | null
          target_unit?: string | null
          target_value?: string | null
          title: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          reminder_enabled?: boolean
          reminder_time?: string | null
          target_unit?: string | null
          target_value?: string | null
          title?: string
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
      notification_logs: {
        Row: {
          channel: string
          error_message: string | null
          id: string
          message: string
          notification_type: string
          sent_at: string
          status: string
        }
        Insert: {
          channel: string
          error_message?: string | null
          id?: string
          message: string
          notification_type: string
          sent_at?: string
          status?: string
        }
        Update: {
          channel?: string
          error_message?: string | null
          id?: string
          message?: string
          notification_type?: string
          sent_at?: string
          status?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          custom_triggers: Json | null
          email: string | null
          email_enabled: boolean
          id: string
          notify_on_low_engagement: boolean
          notify_on_milestones: boolean
          notify_on_missed_login: boolean
          notify_on_streak_break: boolean
          phone: string | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          reminder_frequency: number
          sms_enabled: boolean
          updated_at: string
          whatsapp_enabled: boolean
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          custom_triggers?: Json | null
          email?: string | null
          email_enabled?: boolean
          id?: string
          notify_on_low_engagement?: boolean
          notify_on_milestones?: boolean
          notify_on_missed_login?: boolean
          notify_on_streak_break?: boolean
          phone?: string | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_frequency?: number
          sms_enabled?: boolean
          updated_at?: string
          whatsapp_enabled?: boolean
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          custom_triggers?: Json | null
          email?: string | null
          email_enabled?: boolean
          id?: string
          notify_on_low_engagement?: boolean
          notify_on_milestones?: boolean
          notify_on_missed_login?: boolean
          notify_on_streak_break?: boolean
          phone?: string | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_frequency?: number
          sms_enabled?: boolean
          updated_at?: string
          whatsapp_enabled?: boolean
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      pdf_annotations: {
        Row: {
          book_id: string
          color: string | null
          comment: string | null
          created_at: string
          highlight_rects: Json | null
          highlight_text: string | null
          highlight_type: string | null
          id: string
          note_text: string
          page_number: number
          position_x: number | null
          position_y: number | null
          updated_at: string
        }
        Insert: {
          book_id: string
          color?: string | null
          comment?: string | null
          created_at?: string
          highlight_rects?: Json | null
          highlight_text?: string | null
          highlight_type?: string | null
          id?: string
          note_text: string
          page_number: number
          position_x?: number | null
          position_y?: number | null
          updated_at?: string
        }
        Update: {
          book_id?: string
          color?: string | null
          comment?: string | null
          created_at?: string
          highlight_rects?: Json | null
          highlight_text?: string | null
          highlight_type?: string | null
          id?: string
          note_text?: string
          page_number?: number
          position_x?: number | null
          position_y?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_annotations_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "user_books"
            referencedColumns: ["id"]
          },
        ]
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
      user_books: {
        Row: {
          created_at: string
          current_page: number | null
          file_name: string
          file_url: string
          id: string
          last_read_at: string | null
          title: string
          total_pages: number | null
        }
        Insert: {
          created_at?: string
          current_page?: number | null
          file_name: string
          file_url: string
          id?: string
          last_read_at?: string | null
          title: string
          total_pages?: number | null
        }
        Update: {
          created_at?: string
          current_page?: number | null
          file_name?: string
          file_url?: string
          id?: string
          last_read_at?: string | null
          title?: string
          total_pages?: number | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          preference_key: string
          preference_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          preference_key: string
          preference_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          preference_key?: string
          preference_value?: string
          updated_at?: string
        }
        Relationships: []
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
