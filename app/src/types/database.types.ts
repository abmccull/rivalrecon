export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analyses: {
        Row: {
          average_rating: number | null
          competitive_insights: Json | null
          created_at: string | null
          display_name: string | null
          id: string
          improvement_opportunities: Json | null
          key_insights: Json | null
          key_themes: string[] | null
          keywords: Json | null
          opportunities: Json | null
          product_features: Json | null
          rating_distribution: Json | null
          ratings_over_time: Json | null
          ratings_over_time_old: Json | null
          review_count: number | null
          review_text_sample: Json | null
          sentiment_distribution: Json | null
          sentiment_score: number | null
          submission_id: string | null
          top_negatives: Json | null
          top_positives: Json | null
          trending: string | null
          updated_at: string | null
          word_map: Json | null
        }
        Insert: {
          average_rating?: number | null
          competitive_insights?: Json | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          improvement_opportunities?: Json | null
          key_insights?: Json | null
          key_themes?: string[] | null
          keywords?: Json | null
          opportunities?: Json | null
          product_features?: Json | null
          rating_distribution?: Json | null
          ratings_over_time?: Json | null
          ratings_over_time_old?: Json | null
          review_count?: number | null
          review_text_sample?: Json | null
          sentiment_distribution?: Json | null
          sentiment_score?: number | null
          submission_id?: string | null
          top_negatives?: Json | null
          top_positives?: Json | null
          trending?: string | null
          updated_at?: string | null
          word_map?: Json | null
        }
        Update: {
          average_rating?: number | null
          competitive_insights?: Json | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          improvement_opportunities?: Json | null
          key_insights?: Json | null
          key_themes?: string[] | null
          keywords?: Json | null
          opportunities?: Json | null
          product_features?: Json | null
          rating_distribution?: Json | null
          ratings_over_time?: Json | null
          ratings_over_time_old?: Json | null
          review_count?: number | null
          review_text_sample?: Json | null
          sentiment_distribution?: Json | null
          sentiment_score?: number | null
          submission_id?: string | null
          top_negatives?: Json | null
          top_positives?: Json | null
          trending?: string | null
          updated_at?: string | null
          word_map?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "analyses_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          company: string | null
          company_name: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          first_name: string | null
          id: string
          industry: string | null
          job_title: string | null
          language: string | null
          last_name: string | null
          notification_competitor_alerts: boolean | null
          notification_marketing_emails: boolean | null
          notification_product_updates: boolean | null
          notification_weekly_reports: boolean | null
          phone: string | null
          show_email: boolean | null
          show_phone: boolean | null
          state: string | null
          subscription_status: string | null
          subscription_tier: string | null
          timezone: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company?: string | null
          company_name?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          industry?: string | null
          job_title?: string | null
          language?: string | null
          last_name?: string | null
          notification_competitor_alerts?: boolean | null
          notification_marketing_emails?: boolean | null
          notification_product_updates?: boolean | null
          notification_weekly_reports?: boolean | null
          phone?: string | null
          show_email?: boolean | null
          show_phone?: boolean | null
          state?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          timezone?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company?: string | null
          company_name?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          industry?: string | null
          job_title?: string | null
          language?: string | null
          last_name?: string | null
          notification_competitor_alerts?: boolean | null
          notification_marketing_emails?: boolean | null
          notification_product_updates?: boolean | null
          notification_weekly_reports?: boolean | null
          phone?: string | null
          show_email?: boolean | null
          show_phone?: boolean | null
          state?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          timezone?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      recurring_analyses: {
        Row: {
          created_at: string | null
          day_of_week: number | null
          id: string
          interval: string
          last_run: string | null
          next_run: string
          status: string
          submission_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week?: number | null
          id?: string
          interval: string
          last_run?: string | null
          next_run: string
          status?: string
          submission_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number | null
          id?: string
          interval?: string
          last_run?: string | null
          next_run?: string
          status?: string
          submission_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_analyses_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          api_review_id: string | null
          asin: string | null
          availability: string | null
          badges: Json | null
          created_at: string | null
          currency: string | null
          description: string | null
          features: Json | null
          helpful_votes_text: string | null
          id: string
          images: Json | null
          is_best_seller: boolean | null
          is_vine_review: boolean | null
          price: number | null
          review_author: string | null
          review_date: string | null
          review_images: string[] | null
          review_rating: number | null
          review_text: string | null
          review_title: string | null
          specifications: Json | null
          submission_id: string | null
          total_reviews: number | null
          url: string | null
          variants: Json | null
          verified_purchase: boolean | null
        }
        Insert: {
          api_review_id?: string | null
          asin?: string | null
          availability?: string | null
          badges?: Json | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          helpful_votes_text?: string | null
          id?: string
          images?: Json | null
          is_best_seller?: boolean | null
          is_vine_review?: boolean | null
          price?: number | null
          review_author?: string | null
          review_date?: string | null
          review_images?: string[] | null
          review_rating?: number | null
          review_text?: string | null
          review_title?: string | null
          specifications?: Json | null
          submission_id?: string | null
          total_reviews?: number | null
          url?: string | null
          variants?: Json | null
          verified_purchase?: boolean | null
        }
        Update: {
          api_review_id?: string | null
          asin?: string | null
          availability?: string | null
          badges?: Json | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          helpful_votes_text?: string | null
          id?: string
          images?: Json | null
          is_best_seller?: boolean | null
          is_vine_review?: boolean | null
          price?: number | null
          review_author?: string | null
          review_date?: string | null
          review_images?: string[] | null
          review_rating?: number | null
          review_text?: string | null
          review_title?: string | null
          specifications?: Json | null
          submission_id?: string | null
          total_reviews?: number | null
          url?: string | null
          variants?: Json | null
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          api_response_product_details: Json | null
          asin: string | null
          availability: string | null
          brand_name: string | null
          category_name: string | null
          climate_pledge_friendly: boolean | null
          created_at: string | null
          currency: string | null
          id: string
          is_amazon_choice: boolean | null
          is_best_seller: boolean | null
          is_competitor_product: boolean | null
          is_prime: boolean | null
          last_refreshed_at: string | null
          price: number | null
          product_description: string | null
          product_details_misc: Json | null
          product_features: Json | null
          product_images: Json | null
          product_num_ratings: number | null
          product_overall_rating: number | null
          product_specifications: Json | null
          product_title: string | null
          product_url: string | null
          product_variants: Json | null
          refresh_parent_id: string | null
          sales_volume: string | null
          status: string
          url: string
          user_id: string
        }
        Insert: {
          api_response_product_details?: Json | null
          asin?: string | null
          availability?: string | null
          brand_name?: string | null
          category_name?: string | null
          climate_pledge_friendly?: boolean | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_amazon_choice?: boolean | null
          is_best_seller?: boolean | null
          is_competitor_product?: boolean | null
          is_prime?: boolean | null
          last_refreshed_at?: string | null
          price?: number | null
          product_description?: string | null
          product_details_misc?: Json | null
          product_features?: Json | null
          product_images?: Json | null
          product_num_ratings?: number | null
          product_overall_rating?: number | null
          product_specifications?: Json | null
          product_title?: string | null
          product_url?: string | null
          product_variants?: Json | null
          refresh_parent_id?: string | null
          sales_volume?: string | null
          status: string
          url: string
          user_id?: string
        }
        Update: {
          api_response_product_details?: Json | null
          asin?: string | null
          availability?: string | null
          brand_name?: string | null
          category_name?: string | null
          climate_pledge_friendly?: boolean | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_amazon_choice?: boolean | null
          is_best_seller?: boolean | null
          is_competitor_product?: boolean | null
          is_prime?: boolean | null
          last_refreshed_at?: string | null
          price?: number | null
          product_description?: string | null
          product_details_misc?: Json | null
          product_features?: Json | null
          product_images?: Json | null
          product_num_ratings?: number | null
          product_overall_rating?: number | null
          product_specifications?: Json | null
          product_title?: string | null
          product_url?: string | null
          product_variants?: Json | null
          refresh_parent_id?: string | null
          sales_volume?: string | null
          status?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_refresh_parent_id_fkey"
            columns: ["refresh_parent_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      create_test_table_if_not_exists: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_auth_info: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      test_jwt_validation: {
        Args: Record<PropertyKey, never>
        Returns: {
          jwt: Json
          sub: string
          role: string
        }[]
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
