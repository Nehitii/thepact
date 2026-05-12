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
      account_transfers: {
        Row: {
          amount: number
          created_at: string | null
          from_account_id: string
          id: string
          note: string | null
          to_account_id: string
          transfer_date: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          from_account_id: string
          id?: string
          note?: string | null
          to_account_id: string
          transfer_date?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          from_account_id?: string
          id?: string
          note?: string | null
          to_account_id?: string
          transfer_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_transfers_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_transfers_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      achievement_definitions: {
        Row: {
          bond_reward: number | null
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
          points: number | null
          rarity: string
          required_module: string | null
        }
        Insert: {
          bond_reward?: number | null
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
          points?: number | null
          rarity: string
          required_module?: string | null
        }
        Update: {
          bond_reward?: number | null
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
          points?: number | null
          rarity?: string
          required_module?: string | null
        }
        Relationships: []
      }
      achievement_tracking: {
        Row: {
          bonds_earned_total: number | null
          bonds_spent_total: number | null
          calendar_events_created: number | null
          community_posts: number | null
          consecutive_income_growth_months: number | null
          consecutive_login_days: number | null
          cosmetics_owned: number | null
          created_at: string | null
          current_rank_tier: number | null
          custom_goals_completed: number | null
          custom_goals_created: number | null
          easy_goals_completed: number | null
          easy_goals_created: number | null
          extreme_goals_completed: number | null
          extreme_goals_created: number | null
          finance_months_validated: number | null
          friends_count: number | null
          goals_completed_total: number | null
          guild_messages_sent: number | null
          guilds_joined: number | null
          hard_goals_completed: number | null
          hard_goals_created: number | null
          has_edited_pact: boolean | null
          has_pact: boolean | null
          id: string
          impossible_goals_completed: number | null
          impossible_goals_created: number | null
          journal_entries: number | null
          last_login_date: string | null
          logins_at_same_hour_streak: number | null
          medium_goals_completed: number | null
          medium_goals_created: number | null
          midnight_logins_count: number | null
          modules_purchased: number | null
          months_without_negative_balance: number | null
          pomodoro_sessions: number | null
          pomodoro_total_minutes: number | null
          steps_completed_total: number | null
          todos_completed: number | null
          todos_created: number | null
          total_goals_created: number | null
          transactions_logged: number | null
          updated_at: string | null
          user_id: string
          usual_login_hour: number | null
          wishlist_items_acquired: number | null
          wishlist_items_added: number | null
        }
        Insert: {
          bonds_earned_total?: number | null
          bonds_spent_total?: number | null
          calendar_events_created?: number | null
          community_posts?: number | null
          consecutive_income_growth_months?: number | null
          consecutive_login_days?: number | null
          cosmetics_owned?: number | null
          created_at?: string | null
          current_rank_tier?: number | null
          custom_goals_completed?: number | null
          custom_goals_created?: number | null
          easy_goals_completed?: number | null
          easy_goals_created?: number | null
          extreme_goals_completed?: number | null
          extreme_goals_created?: number | null
          finance_months_validated?: number | null
          friends_count?: number | null
          goals_completed_total?: number | null
          guild_messages_sent?: number | null
          guilds_joined?: number | null
          hard_goals_completed?: number | null
          hard_goals_created?: number | null
          has_edited_pact?: boolean | null
          has_pact?: boolean | null
          id?: string
          impossible_goals_completed?: number | null
          impossible_goals_created?: number | null
          journal_entries?: number | null
          last_login_date?: string | null
          logins_at_same_hour_streak?: number | null
          medium_goals_completed?: number | null
          medium_goals_created?: number | null
          midnight_logins_count?: number | null
          modules_purchased?: number | null
          months_without_negative_balance?: number | null
          pomodoro_sessions?: number | null
          pomodoro_total_minutes?: number | null
          steps_completed_total?: number | null
          todos_completed?: number | null
          todos_created?: number | null
          total_goals_created?: number | null
          transactions_logged?: number | null
          updated_at?: string | null
          user_id: string
          usual_login_hour?: number | null
          wishlist_items_acquired?: number | null
          wishlist_items_added?: number | null
        }
        Update: {
          bonds_earned_total?: number | null
          bonds_spent_total?: number | null
          calendar_events_created?: number | null
          community_posts?: number | null
          consecutive_income_growth_months?: number | null
          consecutive_login_days?: number | null
          cosmetics_owned?: number | null
          created_at?: string | null
          current_rank_tier?: number | null
          custom_goals_completed?: number | null
          custom_goals_created?: number | null
          easy_goals_completed?: number | null
          easy_goals_created?: number | null
          extreme_goals_completed?: number | null
          extreme_goals_created?: number | null
          finance_months_validated?: number | null
          friends_count?: number | null
          goals_completed_total?: number | null
          guild_messages_sent?: number | null
          guilds_joined?: number | null
          hard_goals_completed?: number | null
          hard_goals_created?: number | null
          has_edited_pact?: boolean | null
          has_pact?: boolean | null
          id?: string
          impossible_goals_completed?: number | null
          impossible_goals_created?: number | null
          journal_entries?: number | null
          last_login_date?: string | null
          logins_at_same_hour_streak?: number | null
          medium_goals_completed?: number | null
          medium_goals_created?: number | null
          midnight_logins_count?: number | null
          modules_purchased?: number | null
          months_without_negative_balance?: number | null
          pomodoro_sessions?: number | null
          pomodoro_total_minutes?: number | null
          steps_completed_total?: number | null
          todos_completed?: number | null
          todos_created?: number | null
          total_goals_created?: number | null
          transactions_logged?: number | null
          updated_at?: string | null
          user_id?: string
          usual_login_hour?: number | null
          wishlist_items_acquired?: number | null
          wishlist_items_added?: number | null
        }
        Relationships: []
      }
      active_missions: {
        Row: {
          created_at: string
          deadline_type: string
          expires_at: string
          goal_id: string
          id: string
          step_id: string | null
          step_title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deadline_type: string
          expires_at: string
          goal_id: string
          id?: string
          step_id?: string | null
          step_title: string
          user_id: string
        }
        Update: {
          created_at?: string
          deadline_type?: string
          expires_at?: string
          goal_id?: string
          id?: string
          step_id?: string | null
          step_title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_missions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_missions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          account_id: string | null
          amount: number
          category: string | null
          created_at: string
          description: string
          id: string
          life_area_id: string | null
          note: string | null
          source: string
          transaction_date: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount?: number
          category?: string | null
          created_at?: string
          description: string
          id?: string
          life_area_id?: string | null
          note?: string | null
          source?: string
          transaction_date?: string
          transaction_type?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          life_area_id?: string | null
          note?: string | null
          source?: string
          transaction_date?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          blocked_user_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          blocked_user_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          blocked_user_id?: string
          created_at?: string
          id?: string
          user_id?: string
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
      calendar_events: {
        Row: {
          all_day: boolean | null
          category: string | null
          color: string | null
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          is_busy: boolean | null
          linked_goal_id: string | null
          linked_todo_id: string | null
          location: string | null
          recurrence_exception: boolean | null
          recurrence_parent_id: string | null
          recurrence_rule: Json | null
          reminders: Json | null
          start_time: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          all_day?: boolean | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          is_busy?: boolean | null
          linked_goal_id?: string | null
          linked_todo_id?: string | null
          location?: string | null
          recurrence_exception?: boolean | null
          recurrence_parent_id?: string | null
          recurrence_rule?: Json | null
          reminders?: Json | null
          start_time: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          all_day?: boolean | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          is_busy?: boolean | null
          linked_goal_id?: string | null
          linked_todo_id?: string | null
          location?: string | null
          recurrence_exception?: boolean | null
          recurrence_parent_id?: string | null
          recurrence_rule?: Json | null
          reminders?: Json | null
          start_time?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_recurrence_parent_id_fkey"
            columns: ["recurrence_parent_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      category_budgets: {
        Row: {
          budget_type: string
          category: string
          created_at: string | null
          id: string
          monthly_limit: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget_type?: string
          category: string
          created_at?: string | null
          id?: string
          monthly_limit?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget_type?: string
          category?: string
          created_at?: string | null
          id?: string
          monthly_limit?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      coach_conversations: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          last_message_at: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id?: string
          last_message_at?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          last_message_at?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_embeddings: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json
          source_id: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          source_id?: string | null
          source_type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          source_id?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          model: string | null
          role: string
          tokens_in: number | null
          tokens_out: number | null
          tool_call_id: string | null
          tool_calls: Json | null
          user_id: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          id?: string
          model?: string | null
          role: string
          tokens_in?: number | null
          tokens_out?: number | null
          tool_call_id?: string | null
          tool_calls?: Json | null
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          model?: string | null
          role?: string
          tokens_in?: number | null
          tokens_out?: number | null
          tool_call_id?: string | null
          tool_calls?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "coach_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          goal_id: string | null
          goal_name: string | null
          id: string
          inspired_count: number
          is_public: boolean
          post_type: string
          respect_count: number
          support_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          goal_id?: string | null
          goal_name?: string | null
          id?: string
          inspired_count?: number
          is_public?: boolean
          post_type?: string
          respect_count?: number
          support_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          goal_id?: string | null
          goal_name?: string | null
          id?: string
          inspired_count?: number
          is_public?: boolean
          post_type?: string
          respect_count?: number
          support_count?: number
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
      community_reports: {
        Row: {
          created_at: string
          id: string
          post_id: string | null
          reason: string
          reel_id: string | null
          reply_id: string | null
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id?: string | null
          reason: string
          reel_id?: string | null
          reply_id?: string | null
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string | null
          reason?: string
          reel_id?: string | null
          reply_id?: string | null
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "victory_reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "community_replies"
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
          avatar_border_color: string | null
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
          show_border: boolean | null
          transform_version: number | null
          updated_at: string
        }
        Insert: {
          avatar_border_color?: string | null
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
          show_border?: boolean | null
          transform_version?: number | null
          updated_at?: string
        }
        Update: {
          avatar_border_color?: string | null
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
          show_border?: boolean | null
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
      daily_quests: {
        Row: {
          created_at: string
          date: string
          description: string | null
          id: string
          kind: string
          metadata: Json | null
          progress: number
          reward_bonds: number
          season_id: string | null
          status: string
          target: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          kind: string
          metadata?: Json | null
          progress?: number
          reward_bonds?: number
          season_id?: string | null
          status?: string
          target?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          kind?: string
          metadata?: Json | null
          progress?: number
          reward_bonds?: number
          season_id?: string | null
          status?: string
          target?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_quests_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          actual_outcome: string | null
          confidence: number | null
          context: string | null
          created_at: string
          decided_at: string
          decision_text: string
          expected_outcome: string | null
          hypothesis: string | null
          id: string
          lesson: string | null
          life_area_id: string | null
          related_goal_id: string | null
          related_review_id: string | null
          reversibility: string | null
          review_at: string | null
          reviewed_at: string | null
          status: string
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_outcome?: string | null
          confidence?: number | null
          context?: string | null
          created_at?: string
          decided_at?: string
          decision_text: string
          expected_outcome?: string | null
          hypothesis?: string | null
          id?: string
          lesson?: string | null
          life_area_id?: string | null
          related_goal_id?: string | null
          related_review_id?: string | null
          reversibility?: string | null
          review_at?: string | null
          reviewed_at?: string | null
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_outcome?: string | null
          confidence?: number | null
          context?: string | null
          created_at?: string
          decided_at?: string
          decision_text?: string
          expected_outcome?: string | null
          hypothesis?: string | null
          id?: string
          lesson?: string | null
          life_area_id?: string | null
          related_goal_id?: string | null
          related_review_id?: string | null
          reversibility?: string | null
          review_at?: string | null
          reviewed_at?: string | null
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_related_goal_id_fkey"
            columns: ["related_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_related_review_id_fkey"
            columns: ["related_review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          key: string
          rollout_percent: number
          updated_at: string
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          key: string
          rollout_percent?: number
          updated_at?: string
        }
        Update: {
          description?: string | null
          enabled?: boolean
          key?: string
          rollout_percent?: number
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
      focus_sessions: {
        Row: {
          created_at: string
          duration_minutes: number
          ended_at: string
          goal_id: string | null
          id: string
          notes: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes: number
          ended_at?: string
          goal_id?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          ended_at?: string
          goal_id?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: Database["public"]["Enums"]["friendship_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: Database["public"]["Enums"]["friendship_status"]
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: Database["public"]["Enums"]["friendship_status"]
        }
        Relationships: []
      }
      goal_contracts: {
        Row: {
          created_at: string
          deadline: string | null
          goal_id: string
          id: string
          notes: string | null
          owner_id: string
          settled_at: string | null
          signed_at: string | null
          stake_bonds: number
          status: string
          updated_at: string
          witnesses: string[]
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          goal_id: string
          id?: string
          notes?: string | null
          owner_id: string
          settled_at?: string | null
          signed_at?: string | null
          stake_bonds?: number
          status?: string
          updated_at?: string
          witnesses?: string[]
        }
        Update: {
          created_at?: string
          deadline?: string | null
          goal_id?: string
          id?: string
          notes?: string | null
          owner_id?: string
          settled_at?: string | null
          signed_at?: string | null
          stake_bonds?: number
          status?: string
          updated_at?: string
          witnesses?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "goal_contracts_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_cost_items: {
        Row: {
          category: string | null
          created_at: string
          goal_id: string
          id: string
          name: string
          price: number
          step_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          goal_id: string
          id?: string
          name: string
          price?: number
          step_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          goal_id?: string
          id?: string
          name?: string
          price?: number
          step_id?: string | null
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
          {
            foreignKeyName: "goal_cost_items_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_dependencies: {
        Row: {
          created_at: string
          depends_on_goal_id: string
          goal_id: string
          id: string
          kind: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          depends_on_goal_id: string
          goal_id: string
          id?: string
          kind?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          depends_on_goal_id?: string
          goal_id?: string
          id?: string
          kind?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_dependencies_depends_on_goal_id_fkey"
            columns: ["depends_on_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_dependencies_goal_id_fkey"
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
      goal_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty: string
          estimated_cost: number | null
          goal_type: string
          habit_duration_days: number | null
          id: string
          is_featured: boolean | null
          name: string
          source_goal_id: string | null
          steps: Json
          tags: string[]
          updated_at: string | null
          use_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string
          estimated_cost?: number | null
          goal_type?: string
          habit_duration_days?: number | null
          id?: string
          is_featured?: boolean | null
          name: string
          source_goal_id?: string | null
          steps?: Json
          tags?: string[]
          updated_at?: string | null
          use_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string
          estimated_cost?: number | null
          goal_type?: string
          habit_duration_days?: number | null
          id?: string
          is_featured?: boolean | null
          name?: string
          source_goal_id?: string | null
          steps?: Json
          tags?: string[]
          updated_at?: string | null
          use_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_templates_source_goal_id_fkey"
            columns: ["source_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          child_goal_ids: string[] | null
          completion_date: string | null
          created_at: string | null
          deadline: string | null
          difficulty: Database["public"]["Enums"]["goal_difficulty"] | null
          estimated_cost: number | null
          goal_type: string
          habit_checks: boolean[] | null
          habit_duration_days: number | null
          id: string
          image_url: string | null
          is_dynamic_super: boolean | null
          is_focus: boolean | null
          is_locked: boolean
          life_area_id: string | null
          name: string
          notes: string | null
          pact_id: string
          potential_score: number | null
          prerequisite_habit_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["goal_status"] | null
          super_goal_rule: Json | null
          total_steps: number | null
          type: Database["public"]["Enums"]["goal_type"] | null
          updated_at: string | null
          validated_steps: number | null
        }
        Insert: {
          child_goal_ids?: string[] | null
          completion_date?: string | null
          created_at?: string | null
          deadline?: string | null
          difficulty?: Database["public"]["Enums"]["goal_difficulty"] | null
          estimated_cost?: number | null
          goal_type?: string
          habit_checks?: boolean[] | null
          habit_duration_days?: number | null
          id?: string
          image_url?: string | null
          is_dynamic_super?: boolean | null
          is_focus?: boolean | null
          is_locked?: boolean
          life_area_id?: string | null
          name: string
          notes?: string | null
          pact_id: string
          potential_score?: number | null
          prerequisite_habit_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          super_goal_rule?: Json | null
          total_steps?: number | null
          type?: Database["public"]["Enums"]["goal_type"] | null
          updated_at?: string | null
          validated_steps?: number | null
        }
        Update: {
          child_goal_ids?: string[] | null
          completion_date?: string | null
          created_at?: string | null
          deadline?: string | null
          difficulty?: Database["public"]["Enums"]["goal_difficulty"] | null
          estimated_cost?: number | null
          goal_type?: string
          habit_checks?: boolean[] | null
          habit_duration_days?: number | null
          id?: string
          image_url?: string | null
          is_dynamic_super?: boolean | null
          is_focus?: boolean | null
          is_locked?: boolean
          life_area_id?: string | null
          name?: string
          notes?: string | null
          pact_id?: string
          potential_score?: number | null
          prerequisite_habit_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          super_goal_rule?: Json | null
          total_steps?: number | null
          type?: Database["public"]["Enums"]["goal_type"] | null
          updated_at?: string | null
          validated_steps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_pact_id_fkey"
            columns: ["pact_id"]
            isOneToOne: false
            referencedRelation: "pacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_prerequisite_habit_id_fkey"
            columns: ["prerequisite_habit_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_activity_log: {
        Row: {
          action_type: string
          created_at: string
          guild_id: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          guild_id: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          guild_id?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guild_activity_log_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_announcements: {
        Row: {
          author_id: string
          content: string
          created_at: string
          guild_id: string
          id: string
          pinned: boolean
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          guild_id: string
          id?: string
          pinned?: boolean
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          guild_id?: string
          id?: string
          pinned?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "guild_announcements_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "guild_events"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          duration_minutes: number
          event_date: string
          guild_id: string
          id: string
          max_participants: number | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          duration_minutes?: number
          event_date: string
          guild_id: string
          id?: string
          max_participants?: number | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          duration_minutes?: number
          event_date?: string
          guild_id?: string
          id?: string
          max_participants?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_events_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_goal_contributions: {
        Row: {
          amount: number
          created_at: string
          guild_goal_id: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          guild_goal_id: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          guild_goal_id?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_goal_contributions_guild_goal_id_fkey"
            columns: ["guild_goal_id"]
            isOneToOne: false
            referencedRelation: "guild_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_goals: {
        Row: {
          created_at: string
          created_by: string
          current_value: number
          deadline: string | null
          description: string | null
          guild_id: string
          id: string
          status: string
          target_value: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_value?: number
          deadline?: string | null
          description?: string | null
          guild_id: string
          id?: string
          status?: string
          target_value?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_value?: number
          deadline?: string | null
          description?: string | null
          guild_id?: string
          id?: string
          status?: string
          target_value?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_goals_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          current_uses: number
          expires_at: string | null
          guild_id: string
          id: string
          is_active: boolean
          max_uses: number | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          current_uses?: number
          expires_at?: string | null
          guild_id: string
          id?: string
          is_active?: boolean
          max_uses?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          current_uses?: number
          expires_at?: string | null
          guild_id?: string
          id?: string
          is_active?: boolean
          max_uses?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "guild_invite_codes_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_invites: {
        Row: {
          created_at: string | null
          guild_id: string
          id: string
          invitee_id: string
          inviter_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          guild_id: string
          id?: string
          invitee_id: string
          inviter_id: string
          status?: string
        }
        Update: {
          created_at?: string | null
          guild_id?: string
          id?: string
          invitee_id?: string
          inviter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_invites_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_members: {
        Row: {
          guild_id: string
          id: string
          joined_at: string | null
          rank_id: string | null
          role: string
          user_id: string
        }
        Insert: {
          guild_id: string
          id?: string
          joined_at?: string | null
          rank_id?: string | null
          role?: string
          user_id: string
        }
        Update: {
          guild_id?: string
          id?: string
          joined_at?: string | null
          rank_id?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_members_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_members_rank_id_fkey"
            columns: ["rank_id"]
            isOneToOne: false
            referencedRelation: "guild_ranks"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_messages: {
        Row: {
          content: string
          created_at: string
          guild_id: string
          id: string
          reply_to_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          guild_id: string
          id?: string
          reply_to_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          guild_id?: string
          id?: string
          reply_to_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_messages_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "guild_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_ranks: {
        Row: {
          color: string
          created_at: string
          guild_id: string
          icon: string
          id: string
          is_default: boolean
          name: string
          permissions: Json
          position: number
        }
        Insert: {
          color?: string
          created_at?: string
          guild_id: string
          icon?: string
          id?: string
          is_default?: boolean
          name: string
          permissions?: Json
          position?: number
        }
        Update: {
          color?: string
          created_at?: string
          guild_id?: string
          icon?: string
          id?: string
          is_default?: boolean
          name?: string
          permissions?: Json
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "guild_ranks_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      guilds: {
        Row: {
          banner_url: string | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_public: boolean
          max_members: number
          motd: string | null
          name: string
          owner_id: string
          total_xp: number
          updated_at: string | null
        }
        Insert: {
          banner_url?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean
          max_members?: number
          motd?: string | null
          name: string
          owner_id: string
          total_xp?: number
          updated_at?: string | null
        }
        Update: {
          banner_url?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean
          max_members?: number
          motd?: string | null
          name?: string
          owner_id?: string
          total_xp?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          bond_reward: number | null
          completed: boolean | null
          created_at: string | null
          freeze_cost: number
          goal_id: string
          id: string
          is_freeze: boolean
          life_area_id: string | null
          log_date: string
          streak_count: number | null
          user_id: string
        }
        Insert: {
          bond_reward?: number | null
          completed?: boolean | null
          created_at?: string | null
          freeze_cost?: number
          goal_id: string
          id?: string
          is_freeze?: boolean
          life_area_id?: string | null
          log_date: string
          streak_count?: number | null
          user_id: string
        }
        Update: {
          bond_reward?: number | null
          completed?: boolean | null
          created_at?: string | null
          freeze_cost?: number
          goal_id?: string
          id?: string
          is_freeze?: boolean
          life_area_id?: string | null
          log_date?: string
          streak_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_logs_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      health_challenges: {
        Row: {
          bond_reward: number
          challenge_type: string
          completed: boolean
          completed_at: string | null
          created_at: string
          current_value: number
          description: string | null
          end_date: string
          id: string
          start_date: string
          target_days: number
          target_value: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bond_reward?: number
          challenge_type: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_value?: number
          description?: string | null
          end_date: string
          id?: string
          start_date: string
          target_days?: number
          target_value: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bond_reward?: number
          challenge_type?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_value?: number
          description?: string | null
          end_date?: string
          id?: string
          start_date?: string
          target_days?: number
          target_value?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_data: {
        Row: {
          activity_level: number | null
          created_at: string
          energy_afternoon: number | null
          energy_evening: number | null
          energy_morning: number | null
          entry_date: string
          hydration_glasses: number | null
          id: string
          meal_balance: number | null
          mental_load: number | null
          mood_journal: string | null
          mood_level: number | null
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
          energy_afternoon?: number | null
          energy_evening?: number | null
          energy_morning?: number | null
          entry_date?: string
          hydration_glasses?: number | null
          id?: string
          meal_balance?: number | null
          mental_load?: number | null
          mood_journal?: string | null
          mood_level?: number | null
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
          energy_afternoon?: number | null
          energy_evening?: number | null
          energy_morning?: number | null
          entry_date?: string
          hydration_glasses?: number | null
          id?: string
          meal_balance?: number | null
          mental_load?: number | null
          mood_journal?: string | null
          mood_level?: number | null
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
          checkin_mode: string
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
          checkin_mode?: string
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
          checkin_mode?: string
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
      health_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_checkin_date: string | null
          longest_streak: number
          total_checkins: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_checkin_date?: string | null
          longest_streak?: number
          total_checkins?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_checkin_date?: string | null
          longest_streak?: number
          total_checkins?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          accent_color: string | null
          align_id: string | null
          content: string
          created_at: string
          energy_level: number | null
          font_id: string | null
          id: string
          is_favorite: boolean | null
          life_context: string | null
          line_numbers: boolean | null
          linked_goal_id: string | null
          mood: string
          size_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          valence_level: number | null
        }
        Insert: {
          accent_color?: string | null
          align_id?: string | null
          content: string
          created_at?: string
          energy_level?: number | null
          font_id?: string | null
          id?: string
          is_favorite?: boolean | null
          life_context?: string | null
          line_numbers?: boolean | null
          linked_goal_id?: string | null
          mood?: string
          size_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          valence_level?: number | null
        }
        Update: {
          accent_color?: string | null
          align_id?: string | null
          content?: string
          created_at?: string
          energy_level?: number | null
          font_id?: string | null
          id?: string
          is_favorite?: boolean | null
          life_context?: string | null
          line_numbers?: boolean | null
          linked_goal_id?: string | null
          mood?: string
          size_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          valence_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_linked_goal_id_fkey"
            columns: ["linked_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      life_areas: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          name: string
          sort_order: number
          updated_at: string
          user_id: string
          weight: number
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
          weight?: number
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
          weight?: number
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
      net_worth_snapshots: {
        Row: {
          account_count: number
          created_at: string
          currency: string | null
          details: Json | null
          id: string
          snapshot_date: string
          source: string
          total_balance: number
          user_id: string
        }
        Insert: {
          account_count?: number
          created_at?: string
          currency?: string | null
          details?: Json | null
          id?: string
          snapshot_date: string
          source?: string
          total_balance?: number
          user_id: string
        }
        Update: {
          account_count?: number
          created_at?: string
          currency?: string | null
          details?: Json | null
          id?: string
          snapshot_date?: string
          source?: string
          total_balance?: number
          user_id?: string
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
          quiet_hours_end: string | null
          quiet_hours_start: string | null
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
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
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
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
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
          title_effect: string | null
          title_font: string | null
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
          title_effect?: string | null
          title_font?: string | null
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
          title_effect?: string | null
          title_font?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pomodoro_sessions: {
        Row: {
          break_minutes: number
          completed: boolean
          completed_at: string | null
          created_at: string
          duration_minutes: number
          id: string
          linked_goal_id: string | null
          linked_step_id: string | null
          linked_todo_id: string | null
          notes: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          break_minutes?: number
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          linked_goal_id?: string | null
          linked_step_id?: string | null
          linked_todo_id?: string | null
          notes?: string | null
          started_at?: string
          user_id: string
        }
        Update: {
          break_minutes?: number
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          linked_goal_id?: string | null
          linked_step_id?: string | null
          linked_todo_id?: string | null
          notes?: string | null
          started_at?: string
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
          accent_color: string
          achievement_celebrations_enabled: boolean
          active_banner_id: string | null
          active_frame_id: string | null
          active_pact_id: string | null
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
          finance_budget_alert_pct: number | null
          finance_csv_date_format: string | null
          finance_csv_delimiter: string | null
          finance_default_account_id: string | null
          font_size: number
          goal_unlock_code: string | null
          height: number | null
          id: string
          language: string | null
          last_seen_at: string | null
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
          accent_color?: string
          achievement_celebrations_enabled?: boolean
          active_banner_id?: string | null
          active_frame_id?: string | null
          active_pact_id?: string | null
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
          finance_budget_alert_pct?: number | null
          finance_csv_date_format?: string | null
          finance_csv_delimiter?: string | null
          finance_default_account_id?: string | null
          font_size?: number
          goal_unlock_code?: string | null
          height?: number | null
          id: string
          language?: string | null
          last_seen_at?: string | null
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
          accent_color?: string
          achievement_celebrations_enabled?: boolean
          active_banner_id?: string | null
          active_frame_id?: string | null
          active_pact_id?: string | null
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
          finance_budget_alert_pct?: number | null
          finance_csv_date_format?: string | null
          finance_csv_delimiter?: string | null
          finance_default_account_id?: string | null
          font_size?: number
          goal_unlock_code?: string | null
          height?: number | null
          id?: string
          language?: string | null
          last_seen_at?: string | null
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
        Relationships: [
          {
            foreignKeyName: "profiles_active_pact_id_fkey"
            columns: ["active_pact_id"]
            isOneToOne: false
            referencedRelation: "pacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_finance_default_account_id_fkey"
            columns: ["finance_default_account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_seen_at: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_seen_at?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_seen_at?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
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
          icon_emoji: string | null
          icon_url: string | null
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
          icon_emoji?: string | null
          icon_url?: string | null
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
          icon_emoji?: string | null
          icon_url?: string | null
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
          icon_emoji: string | null
          icon_url: string | null
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
          icon_emoji?: string | null
          icon_url?: string | null
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
          icon_emoji?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          alignment_score: number | null
          answers: Json
          completed_at: string | null
          created_at: string
          highlights: string | null
          id: string
          life_area_scores: Json
          lowlights: string | null
          mood: number | null
          next_focus: string | null
          period_end: string
          period_start: string
          prompts: Json
          started_at: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alignment_score?: number | null
          answers?: Json
          completed_at?: string | null
          created_at?: string
          highlights?: string | null
          id?: string
          life_area_scores?: Json
          lowlights?: string | null
          mood?: number | null
          next_focus?: string | null
          period_end: string
          period_start: string
          prompts?: Json
          started_at?: string
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alignment_score?: number | null
          answers?: Json
          completed_at?: string | null
          created_at?: string
          highlights?: string | null
          id?: string
          life_area_scores?: Json
          lowlights?: string | null
          mood?: number | null
          next_focus?: string | null
          period_end?: string
          period_start?: string
          prompts?: Json
          started_at?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          color: string | null
          completed_at: string | null
          created_at: string | null
          current_amount: number
          deadline: string | null
          icon_emoji: string | null
          id: string
          is_completed: boolean | null
          linked_account_id: string | null
          name: string
          target_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_amount?: number
          deadline?: string | null
          icon_emoji?: string | null
          id?: string
          is_completed?: boolean | null
          linked_account_id?: string | null
          name: string
          target_amount?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_amount?: number
          deadline?: string | null
          icon_emoji?: string | null
          id?: string
          is_completed?: boolean | null
          linked_account_id?: string | null
          name?: string
          target_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_linked_account_id_fkey"
            columns: ["linked_account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          leaderboard_snapshot: Json | null
          name: string
          slug: string
          starts_at: string
          theme: string | null
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          leaderboard_snapshot?: Json | null
          name: string
          slug: string
          starts_at: string
          theme?: string | null
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          leaderboard_snapshot?: Json | null
          name?: string
          slug?: string
          starts_at?: string
          theme?: string | null
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
      shared_goals: {
        Row: {
          goal_id: string
          id: string
          owner_id: string
          shared_at: string | null
          shared_with_id: string
        }
        Insert: {
          goal_id: string
          id?: string
          owner_id: string
          shared_at?: string | null
          shared_with_id: string
        }
        Update: {
          goal_id?: string
          id?: string
          owner_id?: string
          shared_at?: string | null
          shared_with_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_goals_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_pacts: {
        Row: {
          id: string
          joined_at: string | null
          member_id: string
          owner_id: string
          pact_id: string
          role: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          member_id: string
          owner_id: string
          pact_id: string
          role?: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          member_id?: string
          owner_id?: string
          pact_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_pacts_pact_id_fkey"
            columns: ["pact_id"]
            isOneToOne: false
            referencedRelation: "pacts"
            referencedColumns: ["id"]
          },
        ]
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
          exclude_from_spin: boolean
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
          exclude_from_spin?: boolean
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
          exclude_from_spin?: boolean
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
          position: number | null
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
          position?: number | null
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
          position?: number | null
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
          email_2fa_enabled: boolean
          email_code: string | null
          email_code_attempts: number
          email_code_expires_at: string | null
          totp_enabled: boolean
          totp_secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_2fa_enabled?: boolean
          email_code?: string | null
          email_code_attempts?: number
          email_code_expires_at?: string | null
          totp_enabled?: boolean
          totp_secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_2fa_enabled?: boolean
          email_code?: string | null
          email_code_attempts?: number
          email_code_expires_at?: string | null
          totp_enabled?: boolean
          totp_secret?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_accounts: {
        Row: {
          account_type: string | null
          balance: number | null
          balance_date: string | null
          bank_name: string | null
          color: string | null
          created_at: string | null
          icon_emoji: string | null
          icon_url: string | null
          id: string
          initial_balance: number | null
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_type?: string | null
          balance?: number | null
          balance_date?: string | null
          bank_name?: string | null
          color?: string | null
          created_at?: string | null
          icon_emoji?: string | null
          icon_url?: string | null
          id?: string
          initial_balance?: number | null
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_type?: string | null
          balance?: number | null
          balance_date?: string | null
          bank_name?: string | null
          color?: string | null
          created_at?: string | null
          icon_emoji?: string | null
          icon_url?: string | null
          id?: string
          initial_balance?: number | null
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
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
      user_feature_overrides: {
        Row: {
          enabled: boolean
          key: string
          user_id: string
        }
        Insert: {
          enabled: boolean
          key: string
          user_id: string
        }
        Update: {
          enabled?: boolean
          key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feature_overrides_key_fkey"
            columns: ["key"]
            isOneToOne: false
            referencedRelation: "feature_flags"
            referencedColumns: ["key"]
          },
        ]
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
      user_values: {
        Row: {
          created_at: string
          id: string
          label: string
          rank: number
          statement: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          rank?: number
          statement?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          rank?: number
          statement?: string | null
          updated_at?: string
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
          inspired_count: number
          is_public: boolean
          respect_count: number
          support_count: number
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
          inspired_count?: number
          is_public?: boolean
          respect_count?: number
          support_count?: number
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
          inspired_count?: number
          is_public?: boolean
          respect_count?: number
          support_count?: number
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
      weekly_reviews: {
        Row: {
          ai_insights: string | null
          created_at: string | null
          finance_net: number | null
          goals_progressed: number | null
          health_avg_score: number | null
          id: string
          journal_entries_count: number | null
          reflection_note: string | null
          steps_completed: number | null
          todo_completed: number | null
          updated_at: string | null
          user_id: string
          week_end: string
          week_rating: number | null
          week_start: string
        }
        Insert: {
          ai_insights?: string | null
          created_at?: string | null
          finance_net?: number | null
          goals_progressed?: number | null
          health_avg_score?: number | null
          id?: string
          journal_entries_count?: number | null
          reflection_note?: string | null
          steps_completed?: number | null
          todo_completed?: number | null
          updated_at?: string | null
          user_id: string
          week_end: string
          week_rating?: number | null
          week_start: string
        }
        Update: {
          ai_insights?: string | null
          created_at?: string | null
          finance_net?: number | null
          goals_progressed?: number | null
          health_avg_score?: number | null
          id?: string
          journal_entries_count?: number | null
          reflection_note?: string | null
          steps_completed?: number | null
          todo_completed?: number | null
          updated_at?: string | null
          user_id?: string
          week_end?: string
          week_rating?: number | null
          week_start?: string
        }
        Relationships: []
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
          image_url: string | null
          item_type: string
          name: string
          notes: string | null
          priority: string
          sort_order: number
          source_goal_cost_id: string | null
          source_type: string
          updated_at: string
          url: string | null
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
          image_url?: string | null
          item_type?: string
          name: string
          notes?: string | null
          priority?: string
          sort_order?: number
          source_goal_cost_id?: string | null
          source_type?: string
          updated_at?: string
          url?: string | null
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
          image_url?: string | null
          item_type?: string
          name?: string
          notes?: string | null
          priority?: string
          sort_order?: number
          source_goal_cost_id?: string | null
          source_type?: string
          updated_at?: string
          url?: string | null
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
      _bump_quest_progress: {
        Args: { _delta?: number; _kind: string; _user_id: string }
        Returns: undefined
      }
      accept_guild_invite: { Args: { p_invite_id: string }; Returns: Json }
      add_guild_xp: {
        Args: { p_amount: number; p_guild_id: string; p_reason: string }
        Returns: undefined
      }
      admin_grant_cosmetic: {
        Args: {
          p_cosmetic_id: string
          p_cosmetic_type: string
          p_user_id: string
        }
        Returns: Json
      }
      admin_reset_cosmetic: {
        Args: { p_cosmetic_id: string; p_user_id: string }
        Returns: Json
      }
      claim_notification_reward: {
        Args: { p_notification_id: string }
        Returns: Json
      }
      claim_quest: { Args: { _quest_id: string }; Returns: Json }
      create_guild_with_owner: {
        Args: {
          p_color?: string
          p_description?: string
          p_icon?: string
          p_is_public?: boolean
          p_max_members?: number
          p_name: string
        }
        Returns: Json
      }
      execute_account_transfer: {
        Args: {
          p_amount: number
          p_from_account_id: string
          p_note?: string
          p_to_account_id: string
        }
        Returns: Json
      }
      get_accepted_friends: {
        Args: { p_user_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          friend_id: string
          friendship_id: string
        }[]
      }
      get_community_profile: {
        Args: { p_user_id: string }
        Returns: {
          accent_color: string
          active_banner_id: string
          active_frame_id: string
          active_title_id: string
          avatar_frame: string
          avatar_url: string
          community_profile_discoverable: boolean
          display_name: string
          displayed_badges: string[]
          id: string
          personal_quote: string
        }[]
      }
      get_community_profiles: {
        Args: { p_user_ids: string[] }
        Returns: {
          accent_color: string
          active_banner_id: string
          active_frame_id: string
          active_title_id: string
          avatar_frame: string
          avatar_url: string
          community_profile_discoverable: boolean
          display_name: string
          displayed_badges: string[]
          id: string
          personal_quote: string
        }[]
      }
      get_guild_role: {
        Args: { _guild_id: string; _user_id: string }
        Returns: string
      }
      get_mutual_friends_count: {
        Args: { p_other_id: string; p_user_id: string }
        Returns: number
      }
      get_own_2fa_status: {
        Args: never
        Returns: {
          created_at: string
          email_2fa_enabled: boolean
          totp_enabled: boolean
          updated_at: string
          user_id: string
        }[]
      }
      get_public_leaderboard: {
        Args: { p_limit?: number }
        Returns: {
          avatar_url: string
          display_name: string
          goals_completed: number
          points: number
          rank_name: string
          user_id: string
        }[]
      }
      get_streak_freeze_price: { Args: never; Returns: number }
      get_user_2fa_status: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          email_2fa_enabled: boolean
          totp_enabled: boolean
          updated_at: string
        }[]
      }
      grant_achievement: {
        Args: { p_achievement_key: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_reel_view: { Args: { p_reel_id: string }; Returns: undefined }
      increment_tracking_counter: {
        Args: { p_field: string; p_increment?: number; p_user_id: string }
        Returns: undefined
      }
      init_achievement_tracking: { Args: never; Returns: undefined }
      init_todo_stats: { Args: never; Returns: Json }
      is_guild_member: {
        Args: { _guild_id: string; _user_id: string }
        Returns: boolean
      }
      join_guild_via_code: { Args: { p_code: string }; Returns: Json }
      log_guild_activity: {
        Args: {
          p_action: string
          p_guild_id: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: undefined
      }
      mark_achievements_seen: {
        Args: { p_achievement_keys: string[] }
        Returns: undefined
      }
      match_coach_memory: {
        Args: {
          _match_count?: number
          _min_similarity?: number
          _query: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
          source_id: string
          source_type: string
        }[]
      }
      purchase_bundle: { Args: { p_bundle_id: string }; Returns: Json }
      purchase_daily_deal: { Args: { p_deal_id: string }; Returns: Json }
      purchase_shop_item: {
        Args: { p_item_id: string; p_item_type: string; p_price: number }
        Returns: Json
      }
      record_todo_completion: {
        Args: {
          p_completion_date: string
          p_current_month: number
          p_current_year: number
          p_longest_streak: number
          p_month_count: number
          p_new_streak: number
          p_score_increment: number
          p_year_count: number
        }
        Returns: undefined
      }
      redeem_promo_code: { Args: { p_code: string }; Returns: Json }
      reset_pact_data: { Args: { p_pact_id: string }; Returns: boolean }
      settle_contract: {
        Args: { _contract_id: string; _outcome: string }
        Returns: Json
      }
      snapshot_net_worth: {
        Args: { _date?: string }
        Returns: {
          account_count: number
          created_at: string
          currency: string | null
          details: Json | null
          id: string
          snapshot_date: string
          source: string
          total_balance: number
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "net_worth_snapshots"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_achievement_tracking: {
        Args: { p_updates: Json }
        Returns: undefined
      }
      use_streak_freeze: {
        Args: { _date: string; _goal_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "user" | "admin"
      friendship_status: "pending" | "accepted" | "declined"
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
        | "archived"
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
      friendship_status: ["pending", "accepted", "declined"],
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
        "archived",
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
