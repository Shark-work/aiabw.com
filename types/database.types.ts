export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          website: string | null;
          role: "user" | "creator" | "moderator" | "admin";
          language: string;
          location: string | null;
          is_creator: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          role?: "user" | "creator" | "moderator" | "admin";
          language?: string;
          location?: string | null;
          is_creator?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          role?: "user" | "creator" | "moderator" | "admin";
          language?: string;
          location?: string | null;
          is_creator?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: { key: string; value: string; updated_at: string };
        Insert: { key: string; value: string; updated_at?: string };
        Update: { key?: string; value?: string; updated_at?: string };
        Relationships: [];
      };
      subscription_plans: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          interval: "month" | "year";
          price_cents: number;
          currency: string;
          features: Json;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          interval: "month" | "year";
          price_cents?: number;
          currency?: string;
          features?: Json;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          interval?: "month" | "year";
          price_cents?: number;
          currency?: string;
          features?: Json;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          status: "trialing" | "active" | "past_due" | "canceled" | "incomplete";
          provider: string | null;
          provider_customer_id: string | null;
          provider_subscription_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          status?: "trialing" | "active" | "past_due" | "canceled" | "incomplete";
          provider?: string | null;
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          status?: "trialing" | "active" | "past_due" | "canceled" | "incomplete";
          provider?: string | null;
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_cache: {
        Row: {
          cache_key: string;
          payload: Json;
          binary_payload: string | null;
          content_type: string | null;
          expires_at: string | null;
          updated_at: string;
        };
        Insert: {
          cache_key: string;
          payload?: Json;
          binary_payload?: string | null;
          content_type?: string | null;
          expires_at?: string | null;
          updated_at?: string;
        };
        Update: {
          cache_key?: string;
          payload?: Json;
          binary_payload?: string | null;
          content_type?: string | null;
          expires_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      agent_tags: {
        Row: { id: string; agent_id: string; tag: string; created_at: string };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      agent_favorites: {
        Row: { id: string; agent_id: string; user_id: string; created_at: string };
        Insert: { id?: string; agent_id: string; user_id: string; created_at?: string };
        Update: { id?: string; agent_id?: string; user_id?: string; created_at?: string };
        Relationships: [];
      };
      creator_follows: {
        Row: {
          id: string;
          follower_user_id: string;
          creator_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_user_id: string;
          creator_user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_user_id?: string;
          creator_user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      email_notification_log: {
        Row: {
          id: string;
          user_id: string;
          notification_type: string;
          reference_key: string;
          email_to: string;
          subject: string;
          status: string;
          provider: string;
          provider_id: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          notification_type: string;
          reference_key: string;
          email_to: string;
          subject: string;
          status?: string;
          provider?: string;
          provider_id?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      agents: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          prompt: string | null;
          system_prompt: string | null;
          avatar_url: string | null;
          cover_url: string | null;
          category_id: string | null;
          temperature: number;
          metadata: Json;
          status: "draft" | "active" | "archived";
          visibility: "public" | "private" | "unlisted";
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_agents: {
        Row: {
          id: string;
          user_id: string;
          agent_id: string;
          transaction_id: string | null;
          purchased_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          agent_id: string;
          transaction_id?: string | null;
          purchased_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          agent_id?: string;
          transaction_id?: string | null;
          purchased_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      creator_earnings: {
        Row: {
          id: string;
          creator_user_id: string;
          transaction_id: string;
          agent_id: string | null;
          gross_usd: number;
          creator_usd: number;
          platform_usd: number;
          creator_rate: number;
          status: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      creator_wallets: {
        Row: {
          user_id: string;
          available_usd: number;
          pending_usd: number;
          total_earned_usd: number;
          total_withdrawn_usd: number;
          tron_payout_address: string | null;
          tron_bound_at: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          available_usd?: number;
          pending_usd?: number;
          total_earned_usd?: number;
          total_withdrawn_usd?: number;
          tron_payout_address?: string | null;
          tron_bound_at?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          available_usd?: number;
          pending_usd?: number;
          total_earned_usd?: number;
          total_withdrawn_usd?: number;
          tron_payout_address?: string | null;
          tron_bound_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      creator_withdrawals: {
        Row: {
          id: string;
          user_id: string;
          amount_usd: number;
          pay_currency: string;
          payout_address: string;
          status: string;
          provider: string;
          provider_payout_id: string | null;
          raw: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount_usd: number;
          pay_currency?: string;
          payout_address: string;
          status?: string;
          provider?: string;
          provider_payout_id?: string | null;
          raw?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount_usd?: number;
          pay_currency?: string;
          payout_address?: string;
          status?: string;
          provider?: string;
          provider_payout_id?: string | null;
          raw?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invite_codes: {
        Row: { user_id: string; code: string; created_at: string };
        Insert: { user_id: string; code: string; created_at?: string };
        Update: { user_id?: string; code?: string; created_at?: string };
        Relationships: [];
      };
      invite_relationships: {
        Row: {
          id: string;
          inviter_user_id: string;
          invitee_user_id: string;
          invite_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          inviter_user_id: string;
          invitee_user_id: string;
          invite_code: string;
          created_at?: string;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      referral_commissions: {
        Row: {
          id: string;
          inviter_user_id: string;
          transaction_id: string;
          gross_usd: number;
          commission_usd: number;
          commission_rate: number;
          status: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      referral_wallets: {
        Row: {
          user_id: string;
          available_usd: number;
          pending_usd: number;
          total_earned_usd: number;
          total_withdrawn_usd: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          available_usd?: number;
          pending_usd?: number;
          total_earned_usd?: number;
          total_withdrawn_usd?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          available_usd?: number;
          pending_usd?: number;
          total_earned_usd?: number;
          total_withdrawn_usd?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      referral_withdrawals: {
        Row: {
          id: string;
          user_id: string;
          amount_usd: number;
          pay_currency: string;
          payout_address: string;
          status: string;
          provider: string;
          provider_payout_id: string | null;
          raw: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount_usd: number;
          payout_address: string;
          pay_currency?: string;
          status?: string;
          provider?: string;
          provider_payout_id?: string | null;
          raw?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      trial_logs: {
        Row: {
          id: string;
          user_id: string | null;
          agent_id: string | null;
          provider: string | null;
          prompt_tokens: number | null;
          completion_tokens: number | null;
          llm_tier: string | null;
          model: string | null;
          cost_usd: number | null;
          latency_ms: number | null;
          status: string;
          raw: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          agent_id?: string | null;
          provider?: string | null;
          prompt_tokens?: number | null;
          completion_tokens?: number | null;
          llm_tier?: string | null;
          model?: string | null;
          cost_usd?: number | null;
          latency_ms?: number | null;
          status?: string;
          raw?: Json;
          created_at?: string;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      llm_user_daily_stats: {
        Row: {
          user_id: string;
          day: string;
          call_count: number;
          prompt_tokens: number;
          completion_tokens: number;
          cost_usd: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          day?: string;
          call_count?: number;
          prompt_tokens?: number;
          completion_tokens?: number;
          cost_usd?: number;
          updated_at?: string;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      trial_quotas: {
        Row: {
          id: string;
          user_id: string;
          trial_type: string;
          used_count: number;
          limit_count: number;
          reset_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          plan_slug: string;
          order_type: string;
          agent_id: string | null;
          referral_code: string | null;
          inviter_user_id: string | null;
          provider: string;
          provider_payment_id: string | null;
          payment_status: "pending" | "confirming" | "confirmed" | "finished" | "failed" | "refunded" | "expired";
          price_amount: number;
          price_currency: string;
          pay_amount: string | null;
          pay_currency: string | null;
          invoice_url: string | null;
          order_id: string;
          order_description: string | null;
          raw: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_slug: string;
          order_type?: string;
          agent_id?: string | null;
          referral_code?: string | null;
          inviter_user_id?: string | null;
          provider?: string;
          provider_payment_id?: string | null;
          payment_status?: "pending" | "confirming" | "confirmed" | "finished" | "failed" | "refunded" | "expired";
          price_amount: number;
          price_currency: string;
          pay_amount?: string | null;
          pay_currency?: string | null;
          invoice_url?: string | null;
          order_id: string;
          order_description?: string | null;
          raw?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_slug?: string;
          order_type?: string;
          agent_id?: string | null;
          referral_code?: string | null;
          inviter_user_id?: string | null;
          provider?: string;
          provider_payment_id?: string | null;
          payment_status?: "pending" | "confirming" | "confirmed" | "finished" | "failed" | "refunded" | "expired";
          price_amount?: number;
          price_currency?: string;
          pay_amount?: string | null;
          pay_currency?: string | null;
          invoice_url?: string | null;
          order_id?: string;
          order_description?: string | null;
          raw?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      revenue_events: {
        Row: {
          id: string;
          transaction_id: string;
          event_type: string;
          gross_usd: number;
          buyer_user_id: string;
          agent_id: string | null;
          creator_user_id: string | null;
          inviter_user_id: string | null;
          referral_code: string | null;
          processed: boolean;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_public_agents: {
        Args: {
          p_q?: string;
          p_tags?: string[];
          p_category_slug?: string | null;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: Array<{
          slug: string;
          name: string;
          description: string;
          metadata: Json;
          category_name: string | null;
          category_slug: string | null;
          rank: number | null;
        }>;
      };
      list_subscriptions_expiring_on_day: {
        Args: { p_days_from_now?: number };
        Returns: Array<{
          user_id: string;
          email: string;
          period_end: string;
          plan_id: string;
        }>;
      };
      list_inactive_recall_users: {
        Args: { p_days?: number };
        Returns: Array<{
          user_id: string;
          email: string;
          last_sign_in_at: string;
        }>;
      };
    };
    Enums: {
      agent_status: "draft" | "active" | "archived";
      agent_visibility: "public" | "private" | "unlisted";
      user_role: "user" | "creator" | "moderator" | "admin";
      subscription_status: "trialing" | "active" | "past_due" | "canceled" | "incomplete";
      billing_interval: "month" | "year";
      payment_status: "pending" | "confirming" | "confirmed" | "finished" | "failed" | "refunded" | "expired";
    };
    CompositeTypes: Record<string, never>;
  };
};
