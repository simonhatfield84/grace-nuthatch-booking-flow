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
      booking_priorities: {
        Row: {
          created_at: string
          id: number
          item_id: number
          item_type: string
          party_size: number
          priority_rank: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          item_id: number
          item_type: string
          party_size: number
          priority_rank: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          item_id?: number
          item_type?: string
          party_size?: number
          priority_rank?: number
          updated_at?: string
        }
        Relationships: []
      }
      booking_windows: {
        Row: {
          blackout_periods: Json | null
          created_at: string
          days: string[]
          end_date: string | null
          end_time: string
          id: string
          max_bookings_per_slot: number
          service_id: string
          start_date: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          blackout_periods?: Json | null
          created_at?: string
          days?: string[]
          end_date?: string | null
          end_time: string
          id?: string
          max_bookings_per_slot?: number
          service_id: string
          start_date?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          blackout_periods?: Json | null
          created_at?: string
          days?: string[]
          end_date?: string | null
          end_time?: string
          id?: string
          max_bookings_per_slot?: number
          service_id?: string
          start_date?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: number
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: number
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      service_tags: {
        Row: {
          created_at: string
          id: string
          service_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          cancellation_window_hours: number
          created_at: string
          deposit_per_guest: number
          description: string | null
          duration_rules: Json | null
          id: string
          image_url: string | null
          is_secret: boolean
          lead_time_hours: number
          max_guests: number
          min_guests: number
          online_bookable: boolean
          requires_deposit: boolean
          secret_slug: string | null
          tag_ids: string[] | null
          terms_and_conditions: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          cancellation_window_hours?: number
          created_at?: string
          deposit_per_guest?: number
          description?: string | null
          duration_rules?: Json | null
          id?: string
          image_url?: string | null
          is_secret?: boolean
          lead_time_hours?: number
          max_guests?: number
          min_guests?: number
          online_bookable?: boolean
          requires_deposit?: boolean
          secret_slug?: string | null
          tag_ids?: string[] | null
          terms_and_conditions?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          cancellation_window_hours?: number
          created_at?: string
          deposit_per_guest?: number
          description?: string | null
          duration_rules?: Json | null
          id?: string
          image_url?: string | null
          is_secret?: boolean
          lead_time_hours?: number
          max_guests?: number
          min_guests?: number
          online_bookable?: boolean
          requires_deposit?: boolean
          secret_slug?: string | null
          tag_ids?: string[] | null
          terms_and_conditions?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_tag_usage_count: {
        Args: { tag_id: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
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
