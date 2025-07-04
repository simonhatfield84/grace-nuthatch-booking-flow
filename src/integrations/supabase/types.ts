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
      blocks: {
        Row: {
          created_at: string
          date: string
          end_time: string
          id: string
          reason: string | null
          start_time: string
          table_ids: number[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time: string
          id?: string
          reason?: string | null
          start_time: string
          table_ids?: number[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          reason?: string | null
          start_time?: string
          table_ids?: number[] | null
          updated_at?: string
        }
        Relationships: []
      }
      booking_audit: {
        Row: {
          booking_id: number
          change_type: string
          changed_at: string
          changed_by: string | null
          field_name: string | null
          id: string
          new_value: string | null
          notes: string | null
          old_value: string | null
        }
        Insert: {
          booking_id: number
          change_type: string
          changed_at?: string
          changed_by?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          notes?: string | null
          old_value?: string | null
        }
        Update: {
          booking_id?: number
          change_type?: string
          changed_at?: string
          changed_by?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          notes?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_audit_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
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
      bookings: {
        Row: {
          booking_date: string
          booking_reference: string | null
          booking_time: string
          created_at: string | null
          duration_minutes: number | null
          email: string | null
          end_time: string | null
          guest_name: string
          id: number
          is_unallocated: boolean | null
          notes: string | null
          original_table_id: number | null
          party_size: number
          phone: string | null
          service: string | null
          status: string | null
          table_id: number | null
          updated_at: string | null
        }
        Insert: {
          booking_date: string
          booking_reference?: string | null
          booking_time: string
          created_at?: string | null
          duration_minutes?: number | null
          email?: string | null
          end_time?: string | null
          guest_name: string
          id?: number
          is_unallocated?: boolean | null
          notes?: string | null
          original_table_id?: number | null
          party_size: number
          phone?: string | null
          service?: string | null
          status?: string | null
          table_id?: number | null
          updated_at?: string | null
        }
        Update: {
          booking_date?: string
          booking_reference?: string | null
          booking_time?: string
          created_at?: string | null
          duration_minutes?: number | null
          email?: string | null
          end_time?: string | null
          guest_name?: string
          id?: number
          is_unallocated?: boolean | null
          notes?: string | null
          original_table_id?: number | null
          party_size?: number
          phone?: string | null
          service?: string | null
          status?: string | null
          table_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string
          html_content: string
          id: string
          subject: string
          template_key: string
          template_type: string
          text_content: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          html_content: string
          id?: string
          subject: string
          template_key: string
          template_type?: string
          text_content?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          html_content?: string
          id?: string
          subject?: string
          template_key?: string
          template_type?: string
          text_content?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      guest_tags: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          guest_id: string | null
          id: string
          tag_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          guest_id?: string | null
          id?: string
          tag_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          guest_id?: string | null
          id?: string
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_tags_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          import_last_visit_date: string | null
          import_visit_count: number | null
          name: string
          notes: string | null
          opt_in_marketing: boolean | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          import_last_visit_date?: string | null
          import_visit_count?: number | null
          name: string
          notes?: string | null
          opt_in_marketing?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          import_last_visit_date?: string | null
          import_visit_count?: number | null
          name?: string
          notes?: string | null
          opt_in_marketing?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      join_groups: {
        Row: {
          created_at: string
          description: string | null
          id: number
          max_party_size: number
          min_party_size: number
          name: string
          table_ids: number[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          max_party_size?: number
          min_party_size?: number
          name: string
          table_ids: number[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          max_party_size?: number
          min_party_size?: number
          name?: string
          table_ids?: number[]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean
          last_login_at: string | null
          last_name: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          venue_id: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
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
      tables: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: number
          join_groups: number[] | null
          label: string
          online_bookable: boolean | null
          position_x: number | null
          position_y: number | null
          priority_rank: number | null
          seats: number
          section_id: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: number
          join_groups?: number[] | null
          label: string
          online_bookable?: boolean | null
          position_x?: number | null
          position_y?: number | null
          priority_rank?: number | null
          seats: number
          section_id?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: number
          join_groups?: number[] | null
          label?: string
          online_bookable?: boolean | null
          position_x?: number | null
          position_y?: number | null
          priority_rank?: number | null
          seats?: number
          section_id?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tables_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_automatic: boolean | null
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_automatic?: boolean | null
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_automatic?: boolean | null
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          venue_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          venue_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_automatic_tags: {
        Args: { guest_id_param: string }
        Returns: undefined
      }
      calculate_guest_stats: {
        Args: { guest_email: string; guest_phone: string }
        Returns: {
          visit_count: number
          last_visit_date: string
          no_show_count: number
          early_bird_count: number
          last_minute_count: number
          bulk_booking_count: number
        }[]
      }
      find_duplicate_guests: {
        Args: { guest_email?: string; guest_phone?: string }
        Returns: {
          id: string
          name: string
          email: string
          phone: string
          created_at: string
          match_type: string
        }[]
      }
      generate_booking_reference: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_tag_usage_count: {
        Args: { tag_id: string }
        Returns: number
      }
      get_user_venue: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _user_id: string
          _venue_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string; _venue_id: string }
        Returns: boolean
      }
      merge_guests: {
        Args: { primary_guest_id: string; duplicate_guest_id: string }
        Returns: string
      }
      setup_complete: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "manager" | "host" | "staff"
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
    Enums: {
      app_role: ["owner", "manager", "host", "staff"],
    },
  },
} as const
