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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Relationships: []
      }
      character_growth_histories: {
        Row: {
          after_level: number
          after_stage: Database["public"]["Enums"]["character_growth_stage"]
          answer_id: number | null
          before_level: number
          before_stage: Database["public"]["Enums"]["character_growth_stage"]
          character_id: number
          created_at: string
          gained_exp: number
          id: number
          quiz_session_id: number | null
          reason: string
          user_id: string
        }
        Insert: {
          after_level: number
          after_stage: Database["public"]["Enums"]["character_growth_stage"]
          answer_id?: number | null
          before_level: number
          before_stage: Database["public"]["Enums"]["character_growth_stage"]
          character_id: number
          created_at?: string
          gained_exp?: number
          id?: number
          quiz_session_id?: number | null
          reason: string
          user_id: string
        }
        Update: {
          after_level?: number
          after_stage?: Database["public"]["Enums"]["character_growth_stage"]
          answer_id?: number | null
          before_level?: number
          before_stage?: Database["public"]["Enums"]["character_growth_stage"]
          character_id?: number
          created_at?: string
          gained_exp?: number
          id?: number
          quiz_session_id?: number | null
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_growth_histories_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "user_question_answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_growth_histories_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_growth_histories_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      character_type_stages: {
        Row: {
          character_type_id: number
          created_at: string
          growth_stage: Database["public"]["Enums"]["character_growth_stage"]
          id: number
          image_url: string | null
          min_level: number
          updated_at: string
        }
        Insert: {
          character_type_id: number
          created_at?: string
          growth_stage: Database["public"]["Enums"]["character_growth_stage"]
          id?: number
          image_url?: string | null
          min_level?: number
          updated_at?: string
        }
        Update: {
          character_type_id?: number
          created_at?: string
          growth_stage?: Database["public"]["Enums"]["character_growth_stage"]
          id?: number
          image_url?: string | null
          min_level?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_type_stages_character_type_id_fkey"
            columns: ["character_type_id"]
            isOneToOne: false
            referencedRelation: "character_types"
            referencedColumns: ["id"]
          },
        ]
      }
      character_types: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      characters: {
        Row: {
          character_type_id: number
          created_at: string
          exp: number
          growth_stage: Database["public"]["Enums"]["character_growth_stage"]
          id: number
          level: number
          total_exp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          character_type_id: number
          created_at?: string
          exp?: number
          growth_stage?: Database["public"]["Enums"]["character_growth_stage"]
          id?: number
          level?: number
          total_exp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          character_type_id?: number
          created_at?: string
          exp?: number
          growth_stage?: Database["public"]["Enums"]["character_growth_stage"]
          id?: number
          level?: number
          total_exp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "characters_character_type_id_fkey"
            columns: ["character_type_id"]
            isOneToOne: false
            referencedRelation: "character_types"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nickname: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          nickname?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nickname?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      question_choices: {
        Row: {
          choice_text: string
          created_at: string
          id: number
          is_correct: boolean
          question_id: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          choice_text: string
          created_at?: string
          id?: number
          is_correct?: boolean
          question_id: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          choice_text?: string
          created_at?: string
          id?: number
          is_correct?: boolean
          question_id?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_choices_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_upload_batches: {
        Row: {
          admin_user_id: string
          created_at: string
          fail_count: number
          failed_items: Json | null
          file_name: string | null
          id: number
          success_count: number
          total_count: number
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          fail_count?: number
          failed_items?: Json | null
          file_name?: string | null
          id?: number
          success_count?: number
          total_count?: number
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          fail_count?: number
          failed_items?: Json | null
          file_name?: string | null
          id?: number
          success_count?: number
          total_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_upload_batches_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          category: string | null
          created_at: string
          created_by_admin_id: string | null
          difficulty: number
          explanation: string | null
          id: number
          question_text: string
          status: Database["public"]["Enums"]["question_status"]
          updated_at: string
          upload_batch_id: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by_admin_id?: string | null
          difficulty?: number
          explanation?: string | null
          id?: number
          question_text: string
          status?: Database["public"]["Enums"]["question_status"]
          updated_at?: string
          upload_batch_id?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by_admin_id?: string | null
          difficulty?: number
          explanation?: string | null
          id?: number
          question_text?: string
          status?: Database["public"]["Enums"]["question_status"]
          updated_at?: string
          upload_batch_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_created_by_admin_id_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_upload_batch_id_fkey"
            columns: ["upload_batch_id"]
            isOneToOne: false
            referencedRelation: "question_upload_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_session_questions: {
        Row: {
          created_at: string
          id: number
          question_id: number
          quiz_session_id: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: number
          question_id: number
          quiz_session_id: number
          sort_order: number
        }
        Update: {
          created_at?: string
          id?: number
          question_id?: number
          quiz_session_id?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_session_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_session_questions_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_sessions: {
        Row: {
          completed_at: string | null
          correct_count: number
          created_at: string
          earned_exp: number
          id: number
          started_at: string
          status: Database["public"]["Enums"]["quiz_session_status"]
          total_question_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          correct_count?: number
          created_at?: string
          earned_exp?: number
          id?: number
          started_at?: string
          status?: Database["public"]["Enums"]["quiz_session_status"]
          total_question_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          correct_count?: number
          created_at?: string
          earned_exp?: number
          id?: number
          started_at?: string
          status?: Database["public"]["Enums"]["quiz_session_status"]
          total_question_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_question_answers: {
        Row: {
          answered_at: string
          earned_exp: number
          id: number
          is_correct: boolean
          question_id: number
          quiz_session_id: number
          quiz_session_question_id: number | null
          selected_choice_id: number
          user_id: string
        }
        Insert: {
          answered_at?: string
          earned_exp?: number
          id?: number
          is_correct: boolean
          question_id: number
          quiz_session_id: number
          quiz_session_question_id?: number | null
          selected_choice_id: number
          user_id: string
        }
        Update: {
          answered_at?: string
          earned_exp?: number
          id?: number
          is_correct?: boolean
          question_id?: number
          quiz_session_id?: number
          quiz_session_question_id?: number | null
          selected_choice_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_question_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_question_answers_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_question_answers_quiz_session_question_id_fkey"
            columns: ["quiz_session_question_id"]
            isOneToOne: false
            referencedRelation: "quiz_session_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_question_answers_selected_choice_id_fkey"
            columns: ["selected_choice_id"]
            isOneToOne: false
            referencedRelation: "question_choices"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: number
          last_answered_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: number
          last_answered_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: number
          last_answered_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      admin_role: "owner" | "manager"
      character_growth_stage: "egg" | "baby" | "child" | "teen" | "adult"
      question_status: "draft" | "published" | "archived"
      quiz_session_status: "in_progress" | "completed" | "abandoned"
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
    Enums: {
      admin_role: ["owner", "manager"],
      character_growth_stage: ["egg", "baby", "child", "teen", "adult"],
      question_status: ["draft", "published", "archived"],
      quiz_session_status: ["in_progress", "completed", "abandoned"],
    },
  },
} as const
