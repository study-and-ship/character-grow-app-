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
      character_equipment: {
        Row: {
          character_id: number
          equipped_at: string
          slot: Database["public"]["Enums"]["equipment_slot"]
          user_item_id: number
        }
        Insert: {
          character_id: number
          equipped_at?: string
          slot: Database["public"]["Enums"]["equipment_slot"]
          user_item_id: number
        }
        Update: {
          character_id?: number
          equipped_at?: string
          slot?: Database["public"]["Enums"]["equipment_slot"]
          user_item_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_equipment_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_equipment_user_item_id_fkey"
            columns: ["user_item_id"]
            isOneToOne: true
            referencedRelation: "user_items"
            referencedColumns: ["id"]
          },
        ]
      }
      character_growth_histories: {
        Row: {
          after_level: number
          after_stage: Database["public"]["Enums"]["character_growth_stage"]
          before_level: number
          before_stage: Database["public"]["Enums"]["character_growth_stage"]
          character_id: number
          created_at: string
          gained_exp: number
          id: number
          quiz_session_id: number
        }
        Insert: {
          after_level: number
          after_stage: Database["public"]["Enums"]["character_growth_stage"]
          before_level: number
          before_stage: Database["public"]["Enums"]["character_growth_stage"]
          character_id: number
          created_at?: string
          gained_exp: number
          id?: number
          quiz_session_id: number
        }
        Update: {
          after_level?: number
          after_stage?: Database["public"]["Enums"]["character_growth_stage"]
          before_level?: number
          before_stage?: Database["public"]["Enums"]["character_growth_stage"]
          character_id?: number
          created_at?: string
          gained_exp?: number
          id?: number
          quiz_session_id?: number
        }
        Relationships: [
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
            isOneToOne: true
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
          min_level: number
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
          sprite_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name: string
          sprite_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string
          sprite_key?: string
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
          hatched_at: string | null
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
          hatched_at?: string | null
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
          hatched_at?: string | null
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
          {
            foreignKeyName: "characters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      item_categories: {
        Row: {
          code: string
          created_at: string
          id: number
          name: string
          slot: Database["public"]["Enums"]["equipment_slot"]
          target_type: Database["public"]["Enums"]["item_target_type"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: number
          name: string
          slot: Database["public"]["Enums"]["equipment_slot"]
          target_type: Database["public"]["Enums"]["item_target_type"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: number
          name?: string
          slot?: Database["public"]["Enums"]["equipment_slot"]
          target_type?: Database["public"]["Enums"]["item_target_type"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          coins: number
          created_at: string
          id: string
          nickname: string | null
          updated_at: string
        }
        Insert: {
          coins?: number
          created_at?: string
          id: string
          nickname?: string | null
          updated_at?: string
        }
        Update: {
          coins?: number
          created_at?: string
          id?: string
          nickname?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      question_categories: {
        Row: {
          code: string
          created_at: string
          id: number
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: number
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: number
          is_active?: boolean
          name?: string
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
          sort_order: number
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
      questions: {
        Row: {
          category_id: number
          created_at: string
          difficulty: number
          explanation: string | null
          id: number
          question_text: string
          status: Database["public"]["Enums"]["question_status"]
          supersedes_question_id: number | null
          title: string | null
          updated_at: string
          version: number
        }
        Insert: {
          category_id: number
          created_at?: string
          difficulty?: number
          explanation?: string | null
          id?: number
          question_text: string
          status?: Database["public"]["Enums"]["question_status"]
          supersedes_question_id?: number | null
          title?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          category_id?: number
          created_at?: string
          difficulty?: number
          explanation?: string | null
          id?: number
          question_text?: string
          status?: Database["public"]["Enums"]["question_status"]
          supersedes_question_id?: number | null
          title?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "question_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_supersedes_question_id_fkey"
            columns: ["supersedes_question_id"]
            isOneToOne: true
            referencedRelation: "questions"
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
          all_answered_at: string | null
          category_id: number
          completed_at: string | null
          correct_count: number
          created_at: string
          earned_coins: number
          earned_exp: number
          hearts_remaining: number
          id: number
          max_hearts: number
          session_date: string
          started_at: string
          status: Database["public"]["Enums"]["quiz_session_status"]
          total_question_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          all_answered_at?: string | null
          category_id: number
          completed_at?: string | null
          correct_count?: number
          created_at?: string
          earned_coins?: number
          earned_exp?: number
          hearts_remaining?: number
          id?: number
          max_hearts?: number
          session_date?: string
          started_at?: string
          status?: Database["public"]["Enums"]["quiz_session_status"]
          total_question_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          all_answered_at?: string | null
          category_id?: number
          completed_at?: string | null
          correct_count?: number
          created_at?: string
          earned_coins?: number
          earned_exp?: number
          hearts_remaining?: number
          id?: number
          max_hearts?: number
          session_date?: string
          started_at?: string
          status?: Database["public"]["Enums"]["quiz_session_status"]
          total_question_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_sessions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "question_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          asset_key: string
          category_id: number
          created_at: string
          id: number
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          asset_key: string
          category_id: number
          created_at?: string
          id?: number
          is_active?: boolean
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          asset_key?: string
          category_id?: number
          created_at?: string
          id?: number
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "item_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_items: {
        Row: {
          id: number
          item_id: number
          purchased_at: string
          user_id: string
        }
        Insert: {
          id?: number
          item_id: number
          purchased_at?: string
          user_id: string
        }
        Update: {
          id?: number
          item_id?: number
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_question_answers: {
        Row: {
          answered_at: string
          id: number
          is_correct: boolean
          quiz_session_question_id: number
          selected_choice_id: number
        }
        Insert: {
          answered_at?: string
          id?: number
          is_correct: boolean
          quiz_session_question_id: number
          selected_choice_id: number
        }
        Update: {
          answered_at?: string
          id?: number
          is_correct?: boolean
          quiz_session_question_id?: number
          selected_choice_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_question_answers_quiz_session_question_id_fkey"
            columns: ["quiz_session_question_id"]
            isOneToOne: true
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
          last_completed_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          last_completed_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          last_completed_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_quiz_session: { Args: { p_session_id: number }; Returns: Json }
      equip_character_item: {
        Args: {
          p_slot: Database["public"]["Enums"]["equipment_slot"]
          p_user_item_id: number
        }
        Returns: Json
      }
      get_quiz_session: { Args: { p_session_id: number }; Returns: Json }
      get_rankings: { Args: { p_limit?: number }; Returns: Json }
      initialize_user: { Args: { p_nickname: string }; Returns: Json }
      purchase_shop_item: { Args: { p_item_id: number }; Returns: Json }
      start_today_quiz: { Args: { p_category_id: number }; Returns: Json }
      submit_quiz_answer: {
        Args: {
          p_selected_choice_id: number
          p_session_id: number
          p_session_question_id: number
        }
        Returns: Json
      }
      unequip_character_item: {
        Args: { p_slot: Database["public"]["Enums"]["equipment_slot"] }
        Returns: Json
      }
    }
    Enums: {
      character_growth_stage: "egg" | "baby" | "child" | "teen" | "adult"
      equipment_slot: "pattern" | "hat" | "glasses" | "nest"
      item_target_type: "egg" | "pet"
      question_status: "draft" | "published" | "archived"
      quiz_session_status:
        | "in_progress"
        | "ready_to_complete"
        | "completed"
        | "abandoned"
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
      character_growth_stage: ["egg", "baby", "child", "teen", "adult"],
      equipment_slot: ["pattern", "hat", "glasses", "nest"],
      item_target_type: ["egg", "pet"],
      question_status: ["draft", "published", "archived"],
      quiz_session_status: [
        "in_progress",
        "ready_to_complete",
        "completed",
        "abandoned",
      ],
    },
  },
} as const
