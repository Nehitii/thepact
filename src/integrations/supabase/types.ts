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
      achievement_definitions: {
        Row: {
          category: string
          conditions: Json
          created_at: string | null
          description: string
          flavor_text: string | null
          icon_key: string
          id: string
          is_hidden: boolean | null
          key: string
          name: string
          rarity: string
        }
        Insert: {
          category: string
          conditions: Json
          created_at?: string | null
          description: string
          flavor_text?: string | null
          icon_key: string
          id?: string
          is_hidden?: boolean | null
          key: string
          name: string
          rarity: string
        }
        Update: {
          category?: string
          conditions?: Json
          created_at?: string | null
          description?: string
          flavor_text?: string | null
          icon_key?: string
          id?: string
          is_hidden?: boolean | null
          key?: string
          name?: string
          rarity?: string
        }
        Relationships: []
      }
      achievement_tracking: {
        Row: {
          consecutive_income_growth_months: number | null
          consecutive_login_days: number | null
          created_at: string | null
          current_rank_tier: number | null
          custom_goals_completed: number | null
          custom_goals_created: number | null
          easy_goals_completed: number | null
          easy_goals_created: number | null
          extreme_goals_completed: number | null
          extreme_goals_created: number | null
          goals_completed_total: number | null
          hard_goals_completed: number | null
          hard_goals_created: number | null
          has_edited_pact: boolean | null
          has_pact: boolean | null
          id: string
          impossible_goals_completed: number | null
          impossible_goals_created: number | null
          last_login_date: string | null
          logins_at_same_hour_streak: number | null
          medium_goals_completed: number | null
          medium_goals_created: number | null
          midnight_logins_count: number | null
          months_without_negative_balance: number | null
          steps_completed_total: number | null
          total_goals_created: number | null
          updated_at: string | null
          user_id: string
          usual_login_hour: number | null
        }
        Insert: {
          consecutive_income_growth_months?: number | null
          consecutive_login_days?: number | null
          created_at?: string | null
          current_rank_tier?: number | null
          custom_goals_completed?: number | null
          custom_goals_created?: number | null
          easy_goals_completed?: number | null
          easy_goals_created?: number | null
          extreme_goals_completed?: number | null
          extreme_goals_created?: number | null
          goals_completed_total?: number | null
          hard_goals_completed?: number | null
          hard_goals_created?: number | null
          has_edited_pact?: boolean | null
          has_pact?: boolean | null
          id?: string
          impossible_goals_completed?: number | null
          impossible_goals_created?: number | null
          last_login_date?: string | null
          logins_at_same_hour_streak?: number | null
          medium_goals_completed?: number | null
          medium_goals_created?: number | null
          midnight_logins_count?: number | null
          months_without_negative_balance?: number | null
          steps_completed_total?: number | null
          total_goals_created?: number | null
          updated_at?: string | null
          user_id: string
          usual_login_hour?: number | null
        }
        Update: {
          consecutive_income_growth_months?: number | null
          consecutive_login_days?: number | null
          created_at?: string | null
          current_rank_tier?: number | null
          custom_goals_completed?: number | null
          custom_goals_created?: number | null
          easy_goals_completed?: number | null
          easy_goals_created?: number | null
          extreme_goals_completed?: number | null
          extreme_goals_created?: number | null
          goals_completed_total?: number | null
          hard_goals_completed?: number | null
          hard_goals_created?: number | null
          has_edited_pact?: boolean | null
          has_pact?: boolean | null
          id?: string
          impossible_goals_completed?: number | null
          impossible_goals_created?: number | null
          last_login_date?: string | null
          logins_at_same_hour_streak?: number | null
          medium_goals_completed?: number | null
          medium_goals_created?: number | null
          midnight_logins_count?: number | null
          months_without_negative_balance?: number | null
          steps_completed_total?: number | null
          total_goals_created?: number | null
          updated_at?: string | null
          user_id?: string
          usual_login_hour?: number | null
        }
        Relationships: []
      }
      bond_balance: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bond_packs: {
        Row: {
          bond_amount: number
          bonus_percentage: number | null
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean
          name: string
          price_eur: number
          updated_at: string
        }
        Insert: {
          bond_amount: number
          bonus_percentage?: number | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean
          name: string
          price_eur: number
          updated_at?: string
        }
        Update: {
          bond_amount?: number
          bonus_percentage?: number | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean
          name?: string
          price_eur?: number
          updated_at?: string
        }
        Relationships: []
      }
      bond_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      cosmetic_banners: {
        Row: {
          banner_url: string | null
          created_at: string
          gradient_end: string | null
          gradient_start: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          preview_url: string | null
          price: number
          rarity: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          gradient_end?: string | null
          gradient_start?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          preview_url?: string | null
          price?: number
          rarity?: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          gradient_end?: string | null
          gradient_start?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          preview_url?: string | null
          price?: number
          rarity?: string
          updated_at?: string
        }
        Relationships: []
      }
      cosmetic_frames: {
        Row: {
          border_color: string
          created_at: string
          frame_offset_x: number | null
          frame_offset_y: number | null
          frame_scale: number | null
          glow_color: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          preview_url: string | null
          price: number
          rarity: string
          updated_at: string
        }
        Insert: {
          border_color?: string
          created_at?: string
          frame_offset_x?: number | null
          frame_offset_y?: number | null
          frame_scale?: number | null
          glow_color?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          preview_url?: string | null
          price?: number
          rarity?: string
          updated_at?: string
        }
        Update: {
          border_color?: string
          created_at?: string
          frame_offset_x?: number | null
          frame_offset_y?: number | null
          frame_scale?: number | null
          glow_color?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          preview_url?: string | null
          price?: number
          rarity?: string
          updated_at?: string
        }
        Relationships: []
      }
      cosmetic_titles: {
        Row: {
          created_at: string
          glow_color: string | null
          id: string
          is_active: boolean
          is_default: boolean
          price: number
          rarity: string
          text_color: string | null
          title_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          glow_color?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          price?: number
          rarity?: string
          text_color?: string | null
          title_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          glow_color?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          price?: number
          rarity?: string
          text_color?: string | null
          title_text?: string
          updated_at?: string
        }
        Relationships: []
      }
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
          goal_type: string
          habit_checks: boolean[] | null
          habit_duration_days: number | null
          id: string
          image_url: string | null
          is_focus: boolean | null
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
          goal_type?: string
          habit_checks?: boolean[] | null
          habit_duration_days?: number | null
          id?: string
          image_url?: string | null
          is_focus?: boolean | null
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
          goal_type?: string
          habit_checks?: boolean[] | null
          habit_duration_days?: number | null
          id?: string
          image_url?: string | null
          is_focus?: boolean | null
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
      journal_entries: {
        Row: {
          content: string
          created_at: string
          id: string
          life_context: string | null
          mood: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          life_context?: string | null
          mood?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          life_context?: string | null
          mood?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_finance_validations: {
        Row: {
          actual_total_expenses: number | null
          actual_total_income: number | null
          confirmed_expenses: boolean
          confirmed_income: boolean
          created_at: string
          id: string
          month: string
          unplanned_expenses: number | null
          unplanned_income: number | null
          updated_at: string
          user_id: string
          validated_at: string | null
        }
        Insert: {
          actual_total_expenses?: number | null
          actual_total_income?: number | null
          confirmed_expenses?: boolean
          confirmed_income?: boolean
          created_at?: string
          id?: string
          month: string
          unplanned_expenses?: number | null
          unplanned_income?: number | null
          updated_at?: string
          user_id: string
          validated_at?: string | null
        }
        Update: {
          actual_total_expenses?: number | null
          actual_total_income?: number | null
          confirmed_expenses?: boolean
          confirmed_income?: boolean
          created_at?: string
          id?: string
          month?: string
          unplanned_expenses?: number | null
          unplanned_income?: number | null
          updated_at?: string
          user_id?: string
          validated_at?: string | null
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
          checkin_streak: number | null
          checkin_total_count: number | null
          color: string | null
          created_at: string | null
          global_progress: number | null
          id: string
          last_checkin_date: string | null
          mantra: string
          name: string
          points: number | null
          project_end_date: string | null
          project_start_date: string | null
          symbol: string | null
          tier: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          checkin_streak?: number | null
          checkin_total_count?: number | null
          color?: string | null
          created_at?: string | null
          global_progress?: number | null
          id?: string
          last_checkin_date?: string | null
          mantra: string
          name: string
          points?: number | null
          project_end_date?: string | null
          project_start_date?: string | null
          symbol?: string | null
          tier?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          checkin_streak?: number | null
          checkin_total_count?: number | null
          color?: string | null
          created_at?: string | null
          global_progress?: number | null
          id?: string
          last_checkin_date?: string | null
          mantra?: string
          name?: string
          points?: number | null
          project_end_date?: string | null
          project_start_date?: string | null
          symbol?: string | null
          tier?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_banner_id: string | null
          active_frame_id: string | null
          active_title_id: string | null
          age: number | null
          already_funded: number | null
          avatar_frame: string | null
          avatar_url: string | null
          birthday: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          custom_difficulty_active: boolean | null
          custom_difficulty_color: string | null
          custom_difficulty_name: string | null
          display_name: string | null
          displayed_badges: string[] | null
          height: number | null
          id: string
          language: string | null
          personal_quote: string | null
          project_funding_target: number | null
          project_monthly_allocation: number | null
          salary_payment_day: number | null
          timezone: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          active_banner_id?: string | null
          active_frame_id?: string | null
          active_title_id?: string | null
          age?: number | null
          already_funded?: number | null
          avatar_frame?: string | null
          avatar_url?: string | null
          birthday?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          custom_difficulty_active?: boolean | null
          custom_difficulty_color?: string | null
          custom_difficulty_name?: string | null
          display_name?: string | null
          displayed_badges?: string[] | null
          height?: number | null
          id: string
          language?: string | null
          personal_quote?: string | null
          project_funding_target?: number | null
          project_monthly_allocation?: number | null
          salary_payment_day?: number | null
          timezone?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          active_banner_id?: string | null
          active_frame_id?: string | null
          active_title_id?: string | null
          age?: number | null
          already_funded?: number | null
          avatar_frame?: string | null
          avatar_url?: string | null
          birthday?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          custom_difficulty_active?: boolean | null
          custom_difficulty_color?: string | null
          custom_difficulty_name?: string | null
          display_name?: string | null
          displayed_badges?: string[] | null
          height?: number | null
          id?: string
          language?: string | null
          personal_quote?: string | null
          project_funding_target?: number | null
          project_monthly_allocation?: number | null
          salary_payment_day?: number | null
          timezone?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      ranks: {
        Row: {
          background_opacity: number | null
          background_url: string | null
          created_at: string
          frame_color: string | null
          glow_color: string | null
          id: string
          logo_url: string | null
          max_points: number | null
          min_points: number
          name: string
          quote: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          background_opacity?: number | null
          background_url?: string | null
          created_at?: string
          frame_color?: string | null
          glow_color?: string | null
          id?: string
          logo_url?: string | null
          max_points?: number | null
          min_points?: number
          name: string
          quote?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          background_opacity?: number | null
          background_url?: string | null
          created_at?: string
          frame_color?: string | null
          glow_color?: string | null
          id?: string
          logo_url?: string | null
          max_points?: number | null
          min_points?: number
          name?: string
          quote?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_expenses: {
        Row: {
          amount: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_income: {
        Row: {
          amount: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shop_modules: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          icon_key: string | null
          id: string
          is_active: boolean
          is_coming_soon: boolean
          key: string
          name: string
          price_bonds: number
          price_eur: number | null
          rarity: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon_key?: string | null
          id?: string
          is_active?: boolean
          is_coming_soon?: boolean
          key: string
          name: string
          price_bonds?: number
          price_eur?: number | null
          rarity?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon_key?: string | null
          id?: string
          is_active?: boolean
          is_coming_soon?: boolean
          key?: string
          name?: string
          price_bonds?: number
          price_eur?: number | null
          rarity?: string
          updated_at?: string
        }
        Relationships: []
      }
      special_offers: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          items: Json | null
          name: string
          original_price_bonds: number | null
          original_price_eur: number | null
          price_bonds: number | null
          price_eur: number | null
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          items?: Json | null
          name: string
          original_price_bonds?: number | null
          original_price_eur?: number | null
          price_bonds?: number | null
          price_eur?: number | null
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          items?: Json | null
          name?: string
          original_price_bonds?: number | null
          original_price_eur?: number | null
          price_bonds?: number | null
          price_eur?: number | null
          starts_at?: string | null
          updated_at?: string
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
      todo_history: {
        Row: {
          completed_at: string
          id: string
          postpone_count: number
          priority: Database["public"]["Enums"]["todo_priority"]
          task_name: string
          user_id: string
          was_urgent: boolean
        }
        Insert: {
          completed_at?: string
          id?: string
          postpone_count?: number
          priority: Database["public"]["Enums"]["todo_priority"]
          task_name: string
          user_id: string
          was_urgent?: boolean
        }
        Update: {
          completed_at?: string
          id?: string
          postpone_count?: number
          priority?: Database["public"]["Enums"]["todo_priority"]
          task_name?: string
          user_id?: string
          was_urgent?: boolean
        }
        Relationships: []
      }
      todo_stats: {
        Row: {
          created_at: string
          current_month: number
          current_streak: number
          current_year: number
          id: string
          last_completion_date: string | null
          longest_streak: number
          score: number
          tasks_completed_month: number
          tasks_completed_year: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_month?: number
          current_streak?: number
          current_year?: number
          id?: string
          last_completion_date?: string | null
          longest_streak?: number
          score?: number
          tasks_completed_month?: number
          tasks_completed_year?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_month?: number
          current_streak?: number
          current_year?: number
          id?: string
          last_completion_date?: string | null
          longest_streak?: number
          score?: number
          tasks_completed_month?: number
          tasks_completed_year?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      todo_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          deadline: string | null
          id: string
          is_urgent: boolean
          name: string
          postpone_count: number
          priority: Database["public"]["Enums"]["todo_priority"]
          status: Database["public"]["Enums"]["todo_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          is_urgent?: boolean
          name: string
          postpone_count?: number
          priority?: Database["public"]["Enums"]["todo_priority"]
          status?: Database["public"]["Enums"]["todo_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          is_urgent?: boolean
          name?: string
          postpone_count?: number
          priority?: Database["public"]["Enums"]["todo_priority"]
          status?: Database["public"]["Enums"]["todo_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_key: string
          created_at: string | null
          id: string
          progress: number | null
          seen: boolean | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_key: string
          created_at?: string | null
          id?: string
          progress?: number | null
          seen?: boolean | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_key?: string
          created_at?: string | null
          id?: string
          progress?: number | null
          seen?: boolean | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_cosmetics: {
        Row: {
          acquired_at: string
          cosmetic_id: string
          cosmetic_type: string
          id: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          cosmetic_id: string
          cosmetic_type: string
          id?: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          cosmetic_id?: string
          cosmetic_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_module_purchases: {
        Row: {
          id: string
          module_id: string
          purchased_at: string
          user_id: string
        }
        Insert: {
          id?: string
          module_id: string
          purchased_at?: string
          user_id: string
        }
        Update: {
          id?: string
          module_id?: string
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_purchases_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "shop_modules"
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
      increment_tracking_counter: {
        Args: { p_field: string; p_increment?: number; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "user" | "admin"
      goal_difficulty:
        | "easy"
        | "medium"
        | "hard"
        | "extreme"
        | "custom"
        | "impossible"
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
        | "relationship"
        | "diy"
      step_status: "pending" | "completed"
      todo_priority: "low" | "medium" | "high"
      todo_status: "active" | "completed" | "postponed"
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
      goal_difficulty: [
        "easy",
        "medium",
        "hard",
        "extreme",
        "custom",
        "impossible",
      ],
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
        "relationship",
        "diy",
      ],
      step_status: ["pending", "completed"],
      todo_priority: ["low", "medium", "high"],
      todo_status: ["active", "completed", "postponed"],
    },
  },
} as const
