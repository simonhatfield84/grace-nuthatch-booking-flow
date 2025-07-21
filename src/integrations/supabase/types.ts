export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      approval_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used_at: string | null
          venue_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token: string
          used_at?: string | null
          venue_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_tokens_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          created_at: string
          data: Json | null
          event_type: string
          id: string
          processed_at: string | null
          stripe_event_id: string | null
          subscription_id: string | null
          venue_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          event_type: string
          id?: string
          processed_at?: string | null
          stripe_event_id?: string | null
          subscription_id?: string | null
          venue_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          event_type?: string
          id?: string
          processed_at?: string | null
          stripe_event_id?: string | null
          subscription_id?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "venue_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
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
          venue_id: string
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
          venue_id: string
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
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
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
          venue_id: string | null
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
          venue_id?: string | null
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
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_audit_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_audit_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_payments: {
        Row: {
          amount_cents: number
          booking_id: number
          created_at: string | null
          failure_reason: string | null
          id: string
          payment_method_type: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          booking_id: number
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          payment_method_type?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          booking_id?: number
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          payment_method_type?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
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
          venue_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          item_id: number
          item_type: string
          party_size: number
          priority_rank: number
          updated_at?: string
          venue_id: string
        }
        Update: {
          created_at?: string
          id?: number
          item_id?: number
          item_type?: string
          party_size?: number
          priority_rank?: number
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_priorities_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_tokens: {
        Row: {
          booking_id: number
          created_at: string
          expires_at: string
          id: string
          token: string
          token_type: string
          used_at: string | null
        }
        Insert: {
          booking_id: number
          created_at?: string
          expires_at?: string
          id?: string
          token: string
          token_type: string
          used_at?: string | null
        }
        Update: {
          booking_id?: number
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          token_type?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_tokens_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
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
          venue_id: string
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
          venue_id: string
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
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_windows_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
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
          venue_id: string
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
          venue_id: string
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
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          auto_send: boolean
          created_at: string
          description: string | null
          html_content: string
          id: string
          is_active: boolean
          subject: string
          template_key: string
          template_type: string
          text_content: string | null
          updated_at: string
          venue_id: string
        }
        Insert: {
          auto_send?: boolean
          created_at?: string
          description?: string | null
          html_content: string
          id?: string
          is_active?: boolean
          subject: string
          template_key: string
          template_type?: string
          text_content?: string | null
          updated_at?: string
          venue_id: string
        }
        Update: {
          auto_send?: boolean
          created_at?: string
          description?: string | null
          html_content?: string
          id?: string
          is_active?: boolean
          subject?: string
          template_key?: string
          template_type?: string
          text_content?: string | null
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      email_verification_codes: {
        Row: {
          attempts: number | null
          code: string
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          used_at: string | null
        }
        Insert: {
          attempts?: number | null
          code: string
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          used_at?: string | null
        }
        Update: {
          attempts?: number | null
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          used_at?: string | null
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
          venue_id: string
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
          venue_id: string
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
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
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
          venue_id: string
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
          venue_id: string
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
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "join_groups_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          payment_method: string | null
          processed_at: string | null
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string | null
          venue_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          payment_method?: string | null
          processed_at?: string | null
          status: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          venue_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          payment_method?: string | null
          processed_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "venue_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          permissions: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          permissions?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          permissions?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      platform_metrics: {
        Row: {
          active_venues: number | null
          created_at: string
          id: string
          metric_date: string
          pending_venues: number | null
          total_bookings: number | null
          total_revenue_cents: number | null
          total_users: number | null
          total_venues: number | null
        }
        Insert: {
          active_venues?: number | null
          created_at?: string
          id?: string
          metric_date?: string
          pending_venues?: number | null
          total_bookings?: number | null
          total_revenue_cents?: number | null
          total_users?: number | null
          total_venues?: number | null
        }
        Update: {
          active_venues?: number | null
          created_at?: string
          id?: string
          metric_date?: string
          pending_venues?: number | null
          total_bookings?: number | null
          total_revenue_cents?: number | null
          total_users?: number | null
          total_venues?: number | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key: string
          setting_type?: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key?: string
          setting_type?: string
          setting_value?: Json
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
          venue_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: number
          name: string
          sort_order?: number | null
          updated_at?: string
          venue_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          sort_order?: number | null
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit: {
        Row: {
          created_at: string | null
          event_details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
          venue_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
          venue_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
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
          charge_amount_per_guest: number | null
          charge_type: string | null
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
          minimum_guests_for_charge: number | null
          online_bookable: boolean
          requires_deposit: boolean
          requires_payment: boolean | null
          secret_slug: string | null
          tag_ids: string[] | null
          terms_and_conditions: string | null
          title: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          active?: boolean
          cancellation_window_hours?: number
          charge_amount_per_guest?: number | null
          charge_type?: string | null
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
          minimum_guests_for_charge?: number | null
          online_bookable?: boolean
          requires_deposit?: boolean
          requires_payment?: boolean | null
          secret_slug?: string | null
          tag_ids?: string[] | null
          terms_and_conditions?: string | null
          title: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          active?: boolean
          cancellation_window_hours?: number
          charge_amount_per_guest?: number | null
          charge_type?: string | null
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
          minimum_guests_for_charge?: number | null
          online_bookable?: boolean
          requires_deposit?: boolean
          requires_payment?: boolean | null
          secret_slug?: string | null
          tag_ids?: string[] | null
          terms_and_conditions?: string | null
          title?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_interval: string
          created_at: string
          currency: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_bookings_per_month: number | null
          max_venues: number | null
          name: string
          price_cents: number
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          billing_interval?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_bookings_per_month?: number | null
          max_venues?: number | null
          name: string
          price_cents: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          billing_interval?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_bookings_per_month?: number | null
          max_venues?: number | null
          name?: string
          price_cents?: number
          stripe_price_id?: string | null
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
          venue_id: string
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
          venue_id: string
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
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
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
          venue_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_automatic?: boolean | null
          name: string
          venue_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_automatic?: boolean | null
          name?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
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
          venue_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          venue_id: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_settings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_stripe_settings: {
        Row: {
          charge_amount_per_guest: number | null
          charge_type: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          minimum_guests_for_charge: number | null
          stripe_account_id: string | null
          test_mode: boolean | null
          updated_at: string | null
          venue_id: string
          webhook_endpoint_secret: string | null
          webhook_secret: string | null
        }
        Insert: {
          charge_amount_per_guest?: number | null
          charge_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          minimum_guests_for_charge?: number | null
          stripe_account_id?: string | null
          test_mode?: boolean | null
          updated_at?: string | null
          venue_id: string
          webhook_endpoint_secret?: string | null
          webhook_secret?: string | null
        }
        Update: {
          charge_amount_per_guest?: number | null
          charge_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          minimum_guests_for_charge?: number | null
          stripe_account_id?: string | null
          test_mode?: boolean | null
          updated_at?: string | null
          venue_id?: string
          webhook_endpoint_secret?: string | null
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_stripe_settings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: true
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_plan_id: string | null
          trial_end: string | null
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan_id?: string | null
          trial_end?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan_id?: string | null
          trial_end?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_subscriptions_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_subscriptions_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
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
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
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
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
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
      create_default_email_templates: {
        Args: { p_venue_id: string }
        Returns: undefined
      }
      create_verification_code: {
        Args: { user_email: string }
        Returns: string
      }
      detect_role_anomalies: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          venue_id: string
          suspicious_activity: string
          event_count: number
          last_event: string
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
      generate_booking_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_verification_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_webhook_secret: {
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
      is_super_admin: {
        Args: { _user_id: string }
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
      setup_venue_atomic: {
        Args: {
          p_user_id: string
          p_email: string
          p_first_name: string
          p_last_name: string
          p_venue_name: string
          p_venue_slug: string
          p_venue_email: string
          p_venue_phone: string
          p_venue_address: string
        }
        Returns: Json
      }
      update_user_role: {
        Args: {
          target_user_id: string
          new_role: Database["public"]["Enums"]["app_role"]
          target_venue_id: string
        }
        Returns: boolean
      }
      verify_code: {
        Args: { user_email: string; submitted_code: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "manager" | "host" | "staff" | "super_admin"
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
      app_role: ["owner", "manager", "host", "staff", "super_admin"],
    },
  },
} as const
