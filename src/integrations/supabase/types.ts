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
      community_posts: {
        Row: {
          content: string
          created_at: string
          goal_id: string | null
          id: string
          is_public: boolean
          post_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          goal_id?: string | null
          id?: string
          is_public?: boolean
          post_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          goal_id?: string | null
          id?: string
          is_public?: boolean
          post_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string | null
          reaction_type: string
          reel_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id?: string | null
          reaction_type: string
          reel_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string | null
          reaction_type?: string
          reel_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reel_id"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "victory_reels"
            referencedColumns: ["id"]
          },
        ]
      }
      community_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
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
          transform_version: number | null
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
          transform_version?: number | null
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
          transform_version?: number | null
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
      goal_cost_items: {
        Row: {
          created_at: string
          goal_id: string
          id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          goal_id: string
          id?: string
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          goal_id?: string
          id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_cost_items_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_tags: {
        Row: {
          created_at: string
          goal_id: string
          id: string
          tag: string
        }
        Insert: {
          created_at?: string
          goal_id: string
          id?: string
          tag: string
        }
        Update: {
          created_at?: string
          goal_id?: string
          id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_tags_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
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
      health_data: {
        Row: {
          activity_level: number | null
          created_at: string
          entry_date: string
          hydration_glasses: number | null
          id: string
          meal_balance: number | null
          mental_load: number | null
          movement_minutes: number | null
          notes: string | null
          sleep_hours: number | null
          sleep_quality: number | null
          stress_level: number | null
          updated_at: string
          user_id: string
          wake_energy: number | null
        }
        Insert: {
          activity_level?: number | null
          created_at?: string
          entry_date?: string
          hydration_glasses?: number | null
          id?: string
          meal_balance?: number | null
          mental_load?: number | null
          movement_minutes?: number | null
          notes?: string | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          stress_level?: number | null
          updated_at?: string
          user_id: string
          wake_energy?: number | null
        }
        Update: {
          activity_level?: number | null
          created_at?: string
          entry_date?: string
          hydration_glasses?: number | null
          id?: string
          meal_balance?: number | null
          mental_load?: number | null
          movement_minutes?: number | null
          notes?: string | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          stress_level?: number | null
          updated_at?: string
          user_id?: string
          wake_energy?: number | null
        }
        Relationships: []
      }
      health_settings: {
        Row: {
          activity_goal_minutes: number | null
          created_at: string
          height_cm: number | null
          hydration_goal_glasses: number | null
          id: string
          show_activity: boolean
          show_bmi: boolean
          show_hydration: boolean
          show_nutrition: boolean
          show_sleep: boolean
          show_stress: boolean
          sleep_goal_hours: number | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          activity_goal_minutes?: number | null
          created_at?: string
          height_cm?: number | null
          hydration_goal_glasses?: number | null
          id?: string
          show_activity?: boolean
          show_bmi?: boolean
          show_hydration?: boolean
          show_nutrition?: boolean
          show_sleep?: boolean
          show_stress?: boolean
          sleep_goal_hours?: number | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          activity_goal_minutes?: number | null
          created_at?: string
          height_cm?: number | null
          hydration_goal_glasses?: number | null
          id?: string
          show_activity?: boolean
          show_bmi?: boolean
          show_hydration?: boolean
          show_nutrition?: boolean
          show_sleep?: boolean
          show_stress?: boolean
          sleep_goal_hours?: number | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
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
      notification_settings: {
        Row: {
          created_at: string
          focus_mode: boolean
          id: string
          marketing_enabled: boolean
          progress_enabled: boolean
          push_enabled: boolean
          social_enabled: boolean
          system_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          focus_mode?: boolean
          id?: string
          marketing_enabled?: boolean
          progress_enabled?: boolean
          push_enabled?: boolean
          social_enabled?: boolean
          system_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          focus_mode?: boolean
          id?: string
          marketing_enabled?: boolean
          progress_enabled?: boolean
          push_enabled?: boolean
          social_enabled?: boolean
          system_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          category: Database["public"]["Enums"]["notification_category"]
          created_at: string
          cta_label: string | null
          cta_url: string | null
          description: string | null
          expires_at: string | null
          icon_key: string | null
          id: string
          image_url: string | null
          is_read: boolean
          module_key: string | null
          priority: Database["public"]["Enums"]["notification_priority"]
          reward_amount: number | null
          reward_claimed: boolean
          reward_cosmetic_id: string | null
          reward_cosmetic_type: string | null
          reward_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          description?: string | null
          expires_at?: string | null
          icon_key?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean
          module_key?: string | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          reward_amount?: number | null
          reward_claimed?: boolean
          reward_cosmetic_id?: string | null
          reward_cosmetic_type?: string | null
          reward_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          description?: string | null
          expires_at?: string | null
          icon_key?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean
          module_key?: string | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          reward_amount?: number | null
          reward_claimed?: boolean
          reward_cosmetic_id?: string | null
          reward_cosmetic_type?: string | null
          reward_type?: string | null
          title?: string
          user_id?: string
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
      private_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          achievement_celebrations_enabled: boolean
          active_banner_id: string | null
          active_frame_id: string | null
          active_title_id: string | null
          age: number | null
          already_funded: number | null
          avatar_frame: string | null
          avatar_url: string | null
          birthday: string | null
          community_profile_discoverable: boolean
          community_updates_enabled: boolean
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
          particles_enabled: boolean
          particles_intensity: number
          personal_quote: string | null
          project_funding_target: number | null
          project_monthly_allocation: number | null
          reduce_motion: boolean
          salary_payment_day: number | null
          share_achievements: boolean
          share_goals_progress: boolean
          show_activity_status: boolean
          sound_master_enabled: boolean
          sound_progress_enabled: boolean
          sound_success_enabled: boolean
          sound_ui_enabled: boolean
          sound_volume: number
          theme_preference: string
          timezone: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          achievement_celebrations_enabled?: boolean
          active_banner_id?: string | null
          active_frame_id?: string | null
          active_title_id?: string | null
          age?: number | null
          already_funded?: number | null
          avatar_frame?: string | null
          avatar_url?: string | null
          birthday?: string | null
          community_profile_discoverable?: boolean
          community_updates_enabled?: boolean
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
          particles_enabled?: boolean
          particles_intensity?: number
          personal_quote?: string | null
          project_funding_target?: number | null
          project_monthly_allocation?: number | null
          reduce_motion?: boolean
          salary_payment_day?: number | null
          share_achievements?: boolean
          share_goals_progress?: boolean
          show_activity_status?: boolean
          sound_master_enabled?: boolean
          sound_progress_enabled?: boolean
          sound_success_enabled?: boolean
          sound_ui_enabled?: boolean
          sound_volume?: number
          theme_preference?: string
          timezone?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          achievement_celebrations_enabled?: boolean
          active_banner_id?: string | null
          active_frame_id?: string | null
          active_title_id?: string | null
          age?: number | null
          already_funded?: number | null
          avatar_frame?: string | null
          avatar_url?: string | null
          birthday?: string | null
          community_profile_discoverable?: boolean
          community_updates_enabled?: boolean
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
          particles_enabled?: boolean
          particles_intensity?: number
          personal_quote?: string | null
          project_funding_target?: number | null
          project_monthly_allocation?: number | null
          reduce_motion?: boolean
          salary_payment_day?: number | null
          share_achievements?: boolean
          share_goals_progress?: boolean
          show_activity_status?: boolean
          sound_master_enabled?: boolean
          sound_progress_enabled?: boolean
          sound_success_enabled?: boolean
          sound_ui_enabled?: boolean
          sound_volume?: number
          theme_preference?: string
          timezone?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      promo_code_redemptions: {
        Row: {
          id: string
          promo_code_id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          id?: string
          promo_code_id: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          id?: string
          promo_code_id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          reward_amount: number
          reward_type: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          reward_amount?: number
          reward_type?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          reward_amount?: number
          reward_type?: string
          updated_at?: string
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
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
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
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      shop_bundles: {
        Row: {
          created_at: string
          description: string | null
          discount_percentage: number | null
          display_order: number | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          items: Json
          name: string
          original_price_bonds: number | null
          price_bonds: number
          rarity: string
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          display_order?: number | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          items?: Json
          name: string
          original_price_bonds?: number | null
          price_bonds?: number
          rarity?: string
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          display_order?: number | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          items?: Json
          name?: string
          original_price_bonds?: number | null
          price_bonds?: number
          rarity?: string
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shop_daily_deals: {
        Row: {
          created_at: string
          deal_date: string
          discount_percentage: number
          id: string
          is_active: boolean
          item_id: string
          item_type: string
        }
        Insert: {
          created_at?: string
          deal_date?: string
          discount_percentage?: number
          id?: string
          is_active?: boolean
          item_id: string
          item_type: string
        }
        Update: {
          created_at?: string
          deal_date?: string
          discount_percentage?: number
          id?: string
          is_active?: boolean
          item_id?: string
          item_type?: string
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
      shop_wishlist: {
        Row: {
          added_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
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
          category: string | null
          completed_at: string
          id: string
          location: string | null
          postpone_count: number
          priority: Database["public"]["Enums"]["todo_priority"]
          reminder_frequency: string | null
          task_name: string
          task_type: string | null
          user_id: string
          was_urgent: boolean
        }
        Insert: {
          category?: string | null
          completed_at?: string
          id?: string
          location?: string | null
          postpone_count?: number
          priority: Database["public"]["Enums"]["todo_priority"]
          reminder_frequency?: string | null
          task_name: string
          task_type?: string | null
          user_id: string
          was_urgent?: boolean
        }
        Update: {
          category?: string | null
          completed_at?: string
          id?: string
          location?: string | null
          postpone_count?: number
          priority?: Database["public"]["Enums"]["todo_priority"]
          reminder_frequency?: string | null
          task_name?: string
          task_type?: string | null
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
          appointment_time: string | null
          category: string | null
          completed_at: string | null
          created_at: string
          deadline: string | null
          id: string
          is_urgent: boolean
          location: string | null
          name: string
          postpone_count: number
          priority: Database["public"]["Enums"]["todo_priority"]
          reminder_enabled: boolean | null
          reminder_frequency: string | null
          reminder_last_sent: string | null
          status: Database["public"]["Enums"]["todo_status"]
          task_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_time?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          is_urgent?: boolean
          location?: string | null
          name: string
          postpone_count?: number
          priority?: Database["public"]["Enums"]["todo_priority"]
          reminder_enabled?: boolean | null
          reminder_frequency?: string | null
          reminder_last_sent?: string | null
          status?: Database["public"]["Enums"]["todo_status"]
          task_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_time?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          is_urgent?: boolean
          location?: string | null
          name?: string
          postpone_count?: number
          priority?: Database["public"]["Enums"]["todo_priority"]
          reminder_enabled?: boolean | null
          reminder_frequency?: string | null
          reminder_last_sent?: string | null
          status?: Database["public"]["Enums"]["todo_status"]
          task_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_2fa_settings: {
        Row: {
          created_at: string
          totp_enabled: boolean
          totp_secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          totp_enabled?: boolean
          totp_secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          totp_enabled?: boolean
          totp_secret?: string | null
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
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
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
      user_recovery_codes: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      user_trusted_devices: {
        Row: {
          created_at: string
          device_label: string | null
          expires_at: string
          id: string
          last_used_at: string | null
          token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_label?: string | null
          expires_at: string
          id?: string
          last_used_at?: string | null
          token_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_label?: string | null
          expires_at?: string
          id?: string
          last_used_at?: string | null
          token_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      victory_reels: {
        Row: {
          caption: string | null
          created_at: string
          duration_seconds: number
          goal_id: string
          id: string
          is_public: boolean
          thumbnail_url: string | null
          updated_at: string
          user_id: string
          video_url: string
          view_count: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          duration_seconds: number
          goal_id: string
          id?: string
          is_public?: boolean
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
          video_url: string
          view_count?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          duration_seconds?: number
          goal_id?: string
          id?: string
          is_public?: boolean
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "victory_reels_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          acquired: boolean
          acquired_at: string | null
          category: string | null
          created_at: string
          estimated_cost: number
          goal_id: string | null
          id: string
          item_type: string
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acquired?: boolean
          acquired_at?: string | null
          category?: string | null
          created_at?: string
          estimated_cost?: number
          goal_id?: string | null
          id?: string
          item_type?: string
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acquired?: boolean
          acquired_at?: string | null
          category?: string | null
          created_at?: string
          estimated_cost?: number
          goal_id?: string | null
          id?: string
          item_type?: string
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
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
      redeem_promo_code: { Args: { p_code: string }; Returns: Json }
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
      notification_category: "system" | "progress" | "social" | "marketing"
      notification_priority:
        | "critical"
        | "important"
        | "informational"
        | "social"
        | "silent"
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
      notification_category: ["system", "progress", "social", "marketing"],
      notification_priority: [
        "critical",
        "important",
        "informational",
        "social",
        "silent",
      ],
      step_status: ["pending", "completed"],
      todo_priority: ["low", "medium", "high"],
      todo_status: ["active", "completed", "postponed"],
    },
  },
} as const
