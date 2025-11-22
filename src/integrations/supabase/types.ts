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
      finance: {
        Row: {
          created_at: string | null
          fixed_expenses: number | null
          id: string
          income: number | null
          month: string
          remaining_budget: number | null
          savings: number | null
          updated_at: string | null
          user_id: string
          variable_expenses: number | null
        }
        Insert: {
          created_at?: string | null
          fixed_expenses?: number | null
          id?: string
          income?: number | null
          month: string
          remaining_budget?: number | null
          savings?: number | null
          updated_at?: string | null
          user_id: string
          variable_expenses?: number | null
        }
        Update: {
          created_at?: string | null
          fixed_expenses?: number | null
          id?: string
          income?: number | null
          month?: string
          remaining_budget?: number | null
          savings?: number | null
          updated_at?: string | null
          user_id?: string
          variable_expenses?: number | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          completion_date: string | null
          created_at: string | null
          difficulty: Database["public"]["Enums"]["goal_difficulty"] | null
          estimated_cost: number | null
          id: string
          image_url: string | null
          name: string
          notes: string | null
          pact_id: string
          potential_score: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["goal_status"] | null
          total_steps: number | null
          type: Database["public"]["Enums"]["goal_type"] | null
          updated_at: string | null
          validated_steps: number | null
        }
        Insert: {
          completion_date?: string | null
          created_at?: string | null
          difficulty?: Database["public"]["Enums"]["goal_difficulty"] | null
          estimated_cost?: number | null
          id?: string
          image_url?: string | null
          name: string
          notes?: string | null
          pact_id: string
          potential_score?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          total_steps?: number | null
          type?: Database["public"]["Enums"]["goal_type"] | null
          updated_at?: string | null
          validated_steps?: number | null
        }
        Update: {
          completion_date?: string | null
          created_at?: string | null
          difficulty?: Database["public"]["Enums"]["goal_difficulty"] | null
          estimated_cost?: number | null
          id?: string
          image_url?: string | null
          name?: string
          notes?: string | null
          pact_id?: string
          potential_score?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          total_steps?: number | null
          type?: Database["public"]["Enums"]["goal_type"] | null
          updated_at?: string | null
          validated_steps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_pact_id_fkey"
            columns: ["pact_id"]
            isOneToOne: false
            referencedRelation: "pacts"
            referencedColumns: ["id"]
          },
        ]
      }
      health: {
        Row: {
          activity: string | null
          created_at: string | null
          date: string
          id: string
          mood: number | null
          notes: string | null
          sleep: number | null
          updated_at: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          activity?: string | null
          created_at?: string | null
          date: string
          id?: string
          mood?: number | null
          notes?: string | null
          sleep?: number | null
          updated_at?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          activity?: string | null
          created_at?: string | null
          date?: string
          id?: string
          mood?: number | null
          notes?: string | null
          sleep?: number | null
          updated_at?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      pact_spending: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          date: string
          goal_id: string | null
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          date: string
          goal_id?: string | null
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          date?: string
          goal_id?: string | null
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pact_spending_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      pacts: {
        Row: {
          color: string | null
          created_at: string | null
          global_progress: number | null
          id: string
          mantra: string
          name: string
          points: number | null
          symbol: string | null
          tier: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          global_progress?: number | null
          id?: string
          mantra: string
          name: string
          points?: number | null
          symbol?: string | null
          tier?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          global_progress?: number | null
          id?: string
          mantra?: string
          name?: string
          points?: number | null
          symbol?: string | null
          tier?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          custom_difficulty_active: boolean | null
          custom_difficulty_name: string | null
          display_name: string | null
          id: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          custom_difficulty_active?: boolean | null
          custom_difficulty_name?: string | null
          display_name?: string | null
          id: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          custom_difficulty_active?: boolean | null
          custom_difficulty_name?: string | null
          display_name?: string | null
          id?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      step_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_status: Database["public"]["Enums"]["step_status"]
          old_status: Database["public"]["Enums"]["step_status"] | null
          step_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["step_status"]
          old_status?: Database["public"]["Enums"]["step_status"] | null
          step_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["step_status"]
          old_status?: Database["public"]["Enums"]["step_status"] | null
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "step_status_history_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
        ]
      }
      steps: {
        Row: {
          completion_date: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          goal_id: string
          id: string
          notes: string | null
          order: number
          status: Database["public"]["Enums"]["step_status"] | null
          title: string
          updated_at: string | null
          validated_at: string | null
        }
        Insert: {
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          goal_id: string
          id?: string
          notes?: string | null
          order: number
          status?: Database["public"]["Enums"]["step_status"] | null
          title: string
          updated_at?: string | null
          validated_at?: string | null
        }
        Update: {
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          goal_id?: string
          id?: string
          notes?: string | null
          order?: number
          status?: Database["public"]["Enums"]["step_status"] | null
          title?: string
          updated_at?: string | null
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "steps_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "admin"
      goal_difficulty: "easy" | "medium" | "hard" | "extreme" | "custom"
      goal_status:
        | "active"
        | "completed"
        | "paused"
        | "cancelled"
        | "not_started"
        | "in_progress"
        | "validated"
        | "fully_completed"
      goal_type:
        | "personal"
        | "professional"
        | "health"
        | "creative"
        | "financial"
        | "learning"
        | "other"
      step_status: "pending" | "completed"
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
      app_role: ["user", "admin"],
      goal_difficulty: ["easy", "medium", "hard", "extreme", "custom"],
      goal_status: [
        "active",
        "completed",
        "paused",
        "cancelled",
        "not_started",
        "in_progress",
        "validated",
        "fully_completed",
      ],
      goal_type: [
        "personal",
        "professional",
        "health",
        "creative",
        "financial",
        "learning",
        "other",
      ],
      step_status: ["pending", "completed"],
    },
  },
} as const
