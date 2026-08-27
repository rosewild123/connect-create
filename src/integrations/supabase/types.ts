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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      blocks: {
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
      boosts: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          source: string
          starts_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          source?: string
          starts_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          source?: string
          starts_at?: string
          user_id?: string
        }
        Relationships: []
      }
      match_reads: {
        Row: {
          last_read_at: string
          match_id: string
          user_id: string
        }
        Insert: {
          last_read_at?: string
          match_id: string
          user_id: string
        }
        Update: {
          last_read_at?: string
          match_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_reads_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          id: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          created_at: string
          duration_ms: number | null
          id: string
          match_id: string
          media_path: string | null
          media_type: string | null
          sender_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          match_id: string
          media_path?: string | null
          media_type?: string | null
          sender_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          match_id?: string
          media_path?: string | null
          media_type?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_verifications: {
        Row: {
          ai_notes: string | null
          created_at: string
          id: string
          pose: string
          selfie_path: string
          status: string
          user_id: string
        }
        Insert: {
          ai_notes?: string | null
          created_at?: string
          id?: string
          pose: string
          selfie_path: string
          status: string
          user_id: string
        }
        Update: {
          ai_notes?: string | null
          created_at?: string
          id?: string
          pose?: string
          selfie_path?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_verified: boolean
          bio: string | null
          completed_collabs: number
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          experience_years: number | null
          id: string
          id_verified: boolean
          is_ambassador: boolean
          is_onboarded: boolean
          is_paused: boolean
          last_active_at: string
          location_city: string | null
          location_country: string | null
          looking_for: string[]
          niches: string[]
          photo_verified: boolean
          photo_verified_at: string | null
          photos: string[]
          platforms: Json
          plus_until: string | null
          premium_until: string | null
          prompts: Json
          referral_code: string | null
          updated_at: string
          willing_to_travel: boolean
        }
        Insert: {
          age_verified?: boolean
          bio?: string | null
          completed_collabs?: number
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          experience_years?: number | null
          id: string
          id_verified?: boolean
          is_ambassador?: boolean
          is_onboarded?: boolean
          is_paused?: boolean
          last_active_at?: string
          location_city?: string | null
          location_country?: string | null
          looking_for?: string[]
          niches?: string[]
          photo_verified?: boolean
          photo_verified_at?: string | null
          photos?: string[]
          platforms?: Json
          plus_until?: string | null
          premium_until?: string | null
          prompts?: Json
          referral_code?: string | null
          updated_at?: string
          willing_to_travel?: boolean
        }
        Update: {
          age_verified?: boolean
          bio?: string | null
          completed_collabs?: number
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          experience_years?: number | null
          id?: string
          id_verified?: boolean
          is_ambassador?: boolean
          is_onboarded?: boolean
          is_paused?: boolean
          last_active_at?: string
          location_city?: string | null
          location_country?: string | null
          looking_for?: string[]
          niches?: string[]
          photo_verified?: boolean
          photo_verified_at?: string | null
          photos?: string[]
          platforms?: Json
          plus_until?: string | null
          premium_until?: string | null
          prompts?: Json
          referral_code?: string | null
          updated_at?: string
          willing_to_travel?: boolean
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          duration_days: number
          expires_at: string | null
          id: string
          max_uses: number
          note: string | null
          tier: string
          updated_at: string
          uses: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          duration_days: number
          expires_at?: string | null
          id?: string
          max_uses?: number
          note?: string | null
          tier: string
          updated_at?: string
          uses?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          duration_days?: number
          expires_at?: string | null
          id?: string
          max_uses?: number
          note?: string | null
          tier?: string
          updated_at?: string
          uses?: number
        }
        Relationships: []
      }
      promo_redemptions: {
        Row: {
          code_id: string
          duration_days: number
          id: string
          redeemed_at: string
          tier: string
          user_id: string
        }
        Insert: {
          code_id: string
          duration_days: number
          id?: string
          redeemed_at?: string
          tier: string
          user_id: string
        }
        Update: {
          code_id?: string
          duration_days?: number
          id?: string
          redeemed_at?: string
          tier?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          code: string
          created_at: string
          id: string
          referred_user_id: string
          referrer_id: string
          reward_days: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          referred_user_id: string
          referrer_id: string
          reward_days?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          referred_user_id?: string
          referrer_id?: string
          reward_days?: number
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_id: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_id: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reported_id?: string
          reporter_id?: string
          status?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          environment: string
          id: string
          price_id: string | null
          product_id: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          environment?: string
          id?: string
          price_id?: string | null
          product_id?: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          environment?: string
          id?: string
          price_id?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      swipes: {
        Row: {
          created_at: string
          direction: string
          id: string
          swipee_id: string
          swiper_id: string
        }
        Insert: {
          created_at?: string
          direction: string
          id?: string
          swipee_id: string
          swiper_id: string
        }
        Update: {
          created_at?: string
          direction?: string
          id?: string
          swipee_id?: string
          swiper_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_sessions: {
        Row: {
          created_at: string
          id: string
          provider: string
          session_id: string
          session_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          provider: string
          session_id: string
          session_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          provider?: string
          session_id?: string
          session_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          age: number | null
          age_verified: boolean | null
          bio: string | null
          completed_collabs: number | null
          created_at: string | null
          display_name: string | null
          experience_years: number | null
          id: string | null
          is_onboarded: boolean | null
          last_active_at: string | null
          location_city: string | null
          location_country: string | null
          looking_for: string[] | null
          niches: string[] | null
          photo_verified: boolean | null
          photo_verified_at: string | null
          photos: string[] | null
          platforms: Json | null
          prompts: Json | null
          updated_at: string | null
          willing_to_travel: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_boost: { Args: { _duration_minutes?: number }; Returns: Json }
      active_boost_ends_at: { Args: { _user_id: string }; Returns: string }
      admin_messaging_stats: { Args: { _days?: number }; Returns: Json }
      admin_search_profiles: {
        Args: { _query: string }
        Returns: {
          display_name: string
          id: string
          is_ambassador: boolean
        }[]
      }
      boosted_user_ids: { Args: never; Returns: string[] }
      boosts_this_month: { Args: never; Returns: number }
      claim_referral: { Args: { _code: string }; Returns: Json }
      gen_referral_code: { Args: never; Returns: string }
      get_hidden_user_ids: { Args: never; Returns: string[] }
      get_my_profile: {
        Args: never
        Returns: {
          age_verified: boolean
          bio: string | null
          completed_collabs: number
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          experience_years: number | null
          id: string
          id_verified: boolean
          is_ambassador: boolean
          is_onboarded: boolean
          is_paused: boolean
          last_active_at: string
          location_city: string | null
          location_country: string | null
          looking_for: string[]
          niches: string[]
          photo_verified: boolean
          photo_verified_at: string | null
          photos: string[]
          platforms: Json
          plus_until: string | null
          premium_until: string | null
          prompts: Json
          referral_code: string | null
          updated_at: string
          willing_to_travel: boolean
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_public_profiles: {
        Args: never
        Returns: {
          age: number
          age_verified: boolean
          bio: string
          completed_collabs: number
          created_at: string
          display_name: string
          experience_years: number
          id: string
          is_onboarded: boolean
          last_active_at: string
          location_city: string
          location_country: string
          looking_for: string[]
          niches: string[]
          photo_verified: boolean
          photo_verified_at: string
          photos: string[]
          platforms: Json
          prompts: Json
          updated_at: string
          willing_to_travel: boolean
        }[]
      }
      has_active_subscription: {
        Args: { _environment: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_ambassadors: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          id: string
        }[]
      }
      redeem_promo_code: { Args: { _code: string }; Returns: Json }
      set_ambassador: {
        Args: { _is: boolean; _user_id: string }
        Returns: Json
      }
      super_likes_today: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      report_reason:
        | "spam"
        | "inappropriate_content"
        | "harassment"
        | "fake_profile"
        | "underage"
        | "other"
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
      app_role: ["admin", "moderator", "user"],
      report_reason: [
        "spam",
        "inappropriate_content",
        "harassment",
        "fake_profile",
        "underage",
        "other",
      ],
    },
  },
} as const
