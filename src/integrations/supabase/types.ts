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
          {
            foreignKeyName: "approval_tokens_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_cache: {
        Row: {
          created_at: string
          date: string
          id: string
          party_size: number
          payload: Json
          service_id: string | null
          venue_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          party_size: number
          payload: Json
          service_id?: string | null
          venue_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          party_size?: number
          payload?: Json
          service_id?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_cache_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_cache_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_logs: {
        Row: {
          action: string | null
          cached: boolean | null
          date: string | null
          error_text: string | null
          id: string
          ip_hash: string | null
          occurred_at: string
          party_size: number | null
          result_slots: number | null
          service_id: string | null
          status: string
          time: string | null
          took_ms: number | null
          ua_hash: string | null
          venue_id: string | null
          venue_slug: string | null
        }
        Insert: {
          action?: string | null
          cached?: boolean | null
          date?: string | null
          error_text?: string | null
          id?: string
          ip_hash?: string | null
          occurred_at?: string
          party_size?: number | null
          result_slots?: number | null
          service_id?: string | null
          status: string
          time?: string | null
          took_ms?: number | null
          ua_hash?: string | null
          venue_id?: string | null
          venue_slug?: string | null
        }
        Update: {
          action?: string | null
          cached?: boolean | null
          date?: string | null
          error_text?: string | null
          id?: string
          ip_hash?: string | null
          occurred_at?: string
          party_size?: number | null
          result_slots?: number | null
          service_id?: string | null
          status?: string
          time?: string | null
          took_ms?: number | null
          ua_hash?: string | null
          venue_id?: string | null
          venue_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_logs_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_logs_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
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
          {
            foreignKeyName: "billing_events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
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
          {
            foreignKeyName: "blocks_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_attempts: {
        Row: {
          created_at: string | null
          date: string | null
          id: string
          party_size: number | null
          reason: string | null
          result: string
          service_id: string | null
          time: string | null
          utm: Json | null
          variant: string | null
          venue_id: string
          venue_slug: string
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          id?: string
          party_size?: number | null
          reason?: string | null
          result: string
          service_id?: string | null
          time?: string | null
          utm?: Json | null
          variant?: string | null
          venue_id: string
          venue_slug: string
        }
        Update: {
          created_at?: string | null
          date?: string | null
          id?: string
          party_size?: number | null
          reason?: string | null
          result?: string
          service_id?: string | null
          time?: string | null
          utm?: Json | null
          variant?: string | null
          venue_id?: string
          venue_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_attempts_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_attempts_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_attempts_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
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
          email_status: string | null
          field_name: string | null
          id: string
          new_value: string | null
          notes: string | null
          notification_details: Json | null
          old_value: string | null
          source_details: Json | null
          source_type: string | null
          venue_id: string | null
        }
        Insert: {
          booking_id: number
          change_type: string
          changed_at?: string
          changed_by?: string | null
          email_status?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          notes?: string | null
          notification_details?: Json | null
          old_value?: string | null
          source_details?: Json | null
          source_type?: string | null
          venue_id?: string | null
        }
        Update: {
          booking_id?: number
          change_type?: string
          changed_at?: string
          changed_by?: string | null
          email_status?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          notes?: string | null
          notification_details?: Json | null
          old_value?: string | null
          source_details?: Json | null
          source_type?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_audit_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_overlaps_review"
            referencedColumns: ["booking_1_id"]
          },
          {
            foreignKeyName: "booking_audit_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_overlaps_review"
            referencedColumns: ["booking_2_id"]
          },
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
          {
            foreignKeyName: "booking_audit_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_locks: {
        Row: {
          booking_date: string
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          ip_hash: string | null
          lock_token: string
          locked_at: string
          party_size: number
          reason: string | null
          released_at: string | null
          service_id: string
          start_time: string
          ua_hash: string | null
          updated_at: string
          venue_id: string
        }
        Insert: {
          booking_date: string
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          ip_hash?: string | null
          lock_token: string
          locked_at?: string
          party_size: number
          reason?: string | null
          released_at?: string | null
          service_id: string
          start_time: string
          ua_hash?: string | null
          updated_at?: string
          venue_id: string
        }
        Update: {
          booking_date?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          ip_hash?: string | null
          lock_token?: string
          locked_at?: string
          party_size?: number
          reason?: string | null
          released_at?: string | null
          service_id?: string
          start_time?: string
          ua_hash?: string | null
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_locks_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_locks_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_locks_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_payments: {
        Row: {
          amount_cents: number
          booking_id: number
          created_at: string
          failure_reason: string | null
          id: string
          payment_method_type: string | null
          processed_at: string | null
          refund_amount_cents: number | null
          refund_reason: string | null
          refund_status: string | null
          refunded_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_refund_id: string | null
          updated_at: string
          venue_id: string
        }
        Insert: {
          amount_cents: number
          booking_id: number
          created_at?: string
          failure_reason?: string | null
          id?: string
          payment_method_type?: string | null
          processed_at?: string | null
          refund_amount_cents?: number | null
          refund_reason?: string | null
          refund_status?: string | null
          refunded_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          updated_at?: string
          venue_id: string
        }
        Update: {
          amount_cents?: number
          booking_id?: number
          created_at?: string
          failure_reason?: string | null
          id?: string
          payment_method_type?: string | null
          processed_at?: string | null
          refund_amount_cents?: number | null
          refund_reason?: string | null
          refund_status?: string | null
          refunded_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_overlaps_review"
            referencedColumns: ["booking_1_id"]
          },
          {
            foreignKeyName: "booking_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_overlaps_review"
            referencedColumns: ["booking_2_id"]
          },
          {
            foreignKeyName: "booking_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_booking_payments_venue"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_booking_payments_venue"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
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
          {
            foreignKeyName: "booking_priorities_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
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
          venue_id: string
        }
        Insert: {
          booking_id: number
          created_at?: string
          expires_at?: string
          id?: string
          token: string
          token_type: string
          used_at?: string | null
          venue_id: string
        }
        Update: {
          booking_id?: number
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          token_type?: string
          used_at?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_tokens_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_overlaps_review"
            referencedColumns: ["booking_1_id"]
          },
          {
            foreignKeyName: "booking_tokens_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_overlaps_review"
            referencedColumns: ["booking_2_id"]
          },
          {
            foreignKeyName: "booking_tokens_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_booking_tokens_venue"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_booking_tokens_venue"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
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
            foreignKeyName: "booking_windows_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_windows_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_windows_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
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
          time_range: unknown
          updated_at: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          variant: string | null
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
          time_range?: unknown
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          variant?: string | null
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
          time_range?: unknown
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          variant?: string | null
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
          {
            foreignKeyName: "bookings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          auto_send: boolean
          created_at: string
          description: string | null
          design_json: Json | null
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
          design_json?: Json | null
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
          design_json?: Json | null
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
          {
            foreignKeyName: "email_templates_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
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
          venue_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          guest_id?: string | null
          id?: string
          tag_id?: string | null
          venue_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          guest_id?: string | null
          id?: string
          tag_id?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_guest_tags_venue"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_guest_tags_venue"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "guests_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_analytics: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          referrer: string | null
          session_id: string
          user_agent: string | null
          viewport_height: number | null
          viewport_width: number | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          viewport_height?: number | null
          viewport_width?: number | null
          visitor_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          viewport_height?: number | null
          viewport_width?: number | null
          visitor_id?: string
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
          {
            foreignKeyName: "join_groups_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          amount_cents: number
          booking_id: number
          created_at: string
          expires_at: string
          id: string
          payment_link: string
          reminder_sent_at: string | null
          status: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          amount_cents: number
          booking_id: number
          created_at?: string
          expires_at?: string
          id?: string
          payment_link: string
          reminder_sent_at?: string | null
          status?: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          amount_cents?: number
          booking_id?: number
          created_at?: string
          expires_at?: string
          id?: string
          payment_link?: string
          reminder_sent_at?: string | null
          status?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_overlaps_review"
            referencedColumns: ["booking_1_id"]
          },
          {
            foreignKeyName: "payment_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_overlaps_review"
            referencedColumns: ["booking_2_id"]
          },
          {
            foreignKeyName: "payment_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          payment_method: string | null
          processed_at: string | null
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          venue_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string | null
          processed_at?: string | null
          status: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          venue_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string | null
          processed_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
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
      platform_documents: {
        Row: {
          content_md: string | null
          created_at: string
          file_size: number | null
          id: string
          last_modified: string
          path: string
          sha: string
          title: string
          type: string
        }
        Insert: {
          content_md?: string | null
          created_at?: string
          file_size?: number | null
          id?: string
          last_modified: string
          path: string
          sha: string
          title: string
          type?: string
        }
        Update: {
          content_md?: string | null
          created_at?: string
          file_size?: number | null
          id?: string
          last_modified?: string
          path?: string
          sha?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      platform_logs: {
        Row: {
          content_text: string | null
          created_at: string
          error_details: Json | null
          id: string
          last_modified: string | null
          metadata: Json | null
          path: string | null
          severity: string | null
          sha: string | null
          type: string
        }
        Insert: {
          content_text?: string | null
          created_at?: string
          error_details?: Json | null
          id?: string
          last_modified?: string | null
          metadata?: Json | null
          path?: string | null
          severity?: string | null
          sha?: string | null
          type: string
        }
        Update: {
          content_text?: string | null
          created_at?: string
          error_details?: Json | null
          id?: string
          last_modified?: string | null
          metadata?: Json | null
          path?: string | null
          severity?: string | null
          sha?: string | null
          type?: string
        }
        Relationships: []
      }
      platform_metadata: {
        Row: {
          created_at: string
          id: string
          key: string
          value_json: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          value_json: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          value_json?: Json
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
          {
            foreignKeyName: "profiles_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
            referencedColumns: ["id"]
          },
        ]
      }
      refactor_runs: {
        Row: {
          created_at: string
          duration_ms: number | null
          failed_tests: number
          git_branch: string | null
          git_commit: string | null
          id: string
          passed_tests: number
          results: Json | null
          status: string
          total_tests: number
          triggered_by: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          failed_tests?: number
          git_branch?: string | null
          git_commit?: string | null
          id?: string
          passed_tests?: number
          results?: Json | null
          status: string
          total_tests?: number
          triggered_by?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          failed_tests?: number
          git_branch?: string | null
          git_commit?: string | null
          id?: string
          passed_tests?: number
          results?: Json | null
          status?: string
          total_tests?: number
          triggered_by?: string | null
        }
        Relationships: []
      }
      reminder_log: {
        Row: {
          booking_id: number
          created_at: string
          id: string
          reminder_type: string
          sent_at: string
          venue_id: string
        }
        Insert: {
          booking_id: number
          created_at?: string
          id?: string
          reminder_type: string
          sent_at?: string
          venue_id: string
        }
        Update: {
          booking_id?: number
          created_at?: string
          id?: string
          reminder_type?: string
          sent_at?: string
          venue_id?: string
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
          {
            foreignKeyName: "sections_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
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
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
          venue_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
          venue_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
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
          {
            foreignKeyName: "security_audit_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
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
          venue_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          tag_id: string
          venue_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          tag_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_service_tags_venue"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_service_tags_venue"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
            referencedColumns: ["id"]
          },
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
          auto_refund_enabled: boolean | null
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
          refund_window_hours: number | null
          requires_deposit: boolean
          requires_payment: boolean
          secret_slug: string | null
          tag_ids: string[] | null
          terms_and_conditions: string | null
          title: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          active?: boolean
          auto_refund_enabled?: boolean | null
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
          refund_window_hours?: number | null
          requires_deposit?: boolean
          requires_payment?: boolean
          secret_slug?: string | null
          tag_ids?: string[] | null
          terms_and_conditions?: string | null
          title: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          active?: boolean
          auto_refund_enabled?: boolean | null
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
          refund_window_hours?: number | null
          requires_deposit?: boolean
          requires_payment?: boolean
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
          {
            foreignKeyName: "services_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_key_audit: {
        Row: {
          action: string
          created_at: string
          environment: string
          error_message: string | null
          id: string
          ip_address: unknown
          key_type: string
          metadata: Json | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
          venue_id: string
        }
        Insert: {
          action: string
          created_at?: string
          environment: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          key_type: string
          metadata?: Json | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
          venue_id: string
        }
        Update: {
          action?: string
          created_at?: string
          environment?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          key_type?: string
          metadata?: Json | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_key_audit_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_key_audit_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
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
          {
            foreignKeyName: "tables_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
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
          {
            foreignKeyName: "tags_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
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
          {
            foreignKeyName: "user_roles_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_branding: {
        Row: {
          accent_color: string
          button_radius: string
          button_shape: string | null
          created_at: string
          font_body: string
          font_heading: string
          id: string
          logo_dark: string | null
          logo_light: string | null
          logo_url: string | null
          primary_color: string
          secondary_color: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          accent_color?: string
          button_radius?: string
          button_shape?: string | null
          created_at?: string
          font_body?: string
          font_heading?: string
          id?: string
          logo_dark?: string | null
          logo_light?: string | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          accent_color?: string
          button_radius?: string
          button_shape?: string | null
          created_at?: string
          font_body?: string
          font_heading?: string
          id?: string
          logo_dark?: string | null
          logo_light?: string | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_branding_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: true
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_branding_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: true
            referencedRelation: "venues_public"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_link_builder: {
        Row: {
          click_count: number | null
          created_at: string
          created_by: string | null
          id: string
          last_clicked_at: string | null
          params: Json
          slug: string
          utm: Json
          venue_id: string
        }
        Insert: {
          click_count?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_clicked_at?: string | null
          params?: Json
          slug: string
          utm?: Json
          venue_id: string
        }
        Update: {
          click_count?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_clicked_at?: string | null
          params?: Json
          slug?: string
          utm?: Json
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_link_builder_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_link_builder_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_media: {
        Row: {
          created_at: string
          height: number | null
          id: string
          path: string
          sort_order: number | null
          type: string
          updated_at: string
          variants: Json | null
          venue_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          path: string
          sort_order?: number | null
          type: string
          updated_at?: string
          variants?: Json | null
          venue_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          path?: string
          sort_order?: number | null
          type?: string
          updated_at?: string
          variants?: Json | null
          venue_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_media_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_media_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
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
          {
            foreignKeyName: "venue_settings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_stripe_settings: {
        Row: {
          charge_amount_per_guest: number | null
          charge_type: string | null
          configuration_status: Json | null
          created_at: string
          encryption_key_id: string | null
          environment: string | null
          id: string
          is_active: boolean
          key_validation_status: Json | null
          last_key_update_at: string | null
          minimum_guests_for_charge: number | null
          publishable_key_live: string | null
          publishable_key_test: string | null
          secret_key_live_encrypted: string | null
          secret_key_test_encrypted: string | null
          test_mode: boolean
          updated_at: string
          venue_id: string
          webhook_secret_live: string | null
          webhook_secret_test: string | null
        }
        Insert: {
          charge_amount_per_guest?: number | null
          charge_type?: string | null
          configuration_status?: Json | null
          created_at?: string
          encryption_key_id?: string | null
          environment?: string | null
          id?: string
          is_active?: boolean
          key_validation_status?: Json | null
          last_key_update_at?: string | null
          minimum_guests_for_charge?: number | null
          publishable_key_live?: string | null
          publishable_key_test?: string | null
          secret_key_live_encrypted?: string | null
          secret_key_test_encrypted?: string | null
          test_mode?: boolean
          updated_at?: string
          venue_id: string
          webhook_secret_live?: string | null
          webhook_secret_test?: string | null
        }
        Update: {
          charge_amount_per_guest?: number | null
          charge_type?: string | null
          configuration_status?: Json | null
          created_at?: string
          encryption_key_id?: string | null
          environment?: string | null
          id?: string
          is_active?: boolean
          key_validation_status?: Json | null
          last_key_update_at?: string | null
          minimum_guests_for_charge?: number | null
          publishable_key_live?: string | null
          publishable_key_test?: string | null
          secret_key_live_encrypted?: string | null
          secret_key_test_encrypted?: string | null
          test_mode?: boolean
          updated_at?: string
          venue_id?: string
          webhook_secret_live?: string | null
          webhook_secret_test?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_stripe_settings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: true
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_stripe_settings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: true
            referencedRelation: "venues_public"
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
          {
            foreignKeyName: "venue_subscriptions_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_widget_settings: {
        Row: {
          about_html: string | null
          copy_json: Json
          created_at: string
          flags_json: Json
          hero_image_url: string | null
          id: string
          updated_at: string
          venue_id: string
          widget_default_variant: string
        }
        Insert: {
          about_html?: string | null
          copy_json?: Json
          created_at?: string
          flags_json?: Json
          hero_image_url?: string | null
          id?: string
          updated_at?: string
          venue_id: string
          widget_default_variant?: string
        }
        Update: {
          about_html?: string | null
          copy_json?: Json
          created_at?: string
          flags_json?: Json
          hero_image_url?: string | null
          id?: string
          updated_at?: string
          venue_id?: string
          widget_default_variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_widget_settings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: true
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_widget_settings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: true
            referencedRelation: "venues_public"
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
      webhook_events: {
        Row: {
          booking_id: number | null
          created_at: string | null
          error_message: string | null
          event_data: Json | null
          event_type: string
          id: string
          processed_at: string | null
          status: string | null
          stripe_event_id: string
          test_mode: boolean | null
          venue_id: string | null
        }
        Insert: {
          booking_id?: number | null
          created_at?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          processed_at?: string | null
          status?: string | null
          stripe_event_id: string
          test_mode?: boolean | null
          venue_id?: string | null
        }
        Update: {
          booking_id?: number | null
          created_at?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          processed_at?: string | null
          status?: string | null
          stripe_event_id?: string
          test_mode?: boolean | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_overlaps_review"
            referencedColumns: ["booking_1_id"]
          },
          {
            foreignKeyName: "webhook_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_overlaps_review"
            referencedColumns: ["booking_2_id"]
          },
          {
            foreignKeyName: "webhook_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_retry_queue: {
        Row: {
          created_at: string
          event_type: string
          id: string
          last_error: string | null
          next_attempt_at: string
          payload: Json
          retry_count: number
          stripe_event_id: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          last_error?: string | null
          next_attempt_at?: string
          payload: Json
          retry_count?: number
          stripe_event_id: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          last_error?: string | null
          next_attempt_at?: string
          payload?: Json
          retry_count?: number
          stripe_event_id?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_retry_queue_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_retry_queue_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      booking_overlaps_review: {
        Row: {
          booking_1_id: number | null
          booking_2_id: number | null
          booking_date: string | null
          end_1: string | null
          end_2: string | null
          guest_1: string | null
          guest_2: string | null
          status_1: string | null
          status_2: string | null
          table_id: number | null
          time_1: string | null
          time_2: string | null
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
      homepage_analytics_summary: {
        Row: {
          avg_session_duration: number | null
          bounces: number | null
          date: string | null
          page_views: number | null
          sessions: number | null
          unique_visitors: number | null
          viewed_sections: Json | null
        }
        Relationships: []
      }
      venue_widget_public_v4: {
        Row: {
          about_html: string | null
          accent_color: string | null
          button_radius: string | null
          copy_json: Json | null
          flags_json: Json | null
          font_body: string | null
          font_heading: string | null
          hero_image_url: string | null
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          venue_name: string | null
          venue_slug: string | null
        }
        Relationships: []
      }
      venues_public: {
        Row: {
          approval_status: string | null
          created_at: string | null
          id: string | null
          name: string | null
          slug: string | null
        }
        Insert: {
          approval_status?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          slug?: string | null
        }
        Update: {
          approval_status?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          slug?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_list_active_holds: {
        Args: { _venue_id?: string }
        Returns: {
          booking_date: string
          expires_at: string
          id: string
          lock_token: string
          locked_at: string
          party_size: number
          remaining_seconds: number
          service_id: string
          service_title: string
          start_time: string
          venue_id: string
          venue_slug: string
        }[]
      }
      admin_list_availability_logs: {
        Args: { _limit?: number; _since?: string; _venue_id?: string }
        Returns: {
          action: string
          cached: boolean
          date: string
          error_text: string
          id: string
          occurred_at: string
          party_size: number
          result_slots: number
          service_id: string
          status: string
          time_slot: string
          took_ms: number
          venue_id: string
          venue_slug: string
        }[]
      }
      assign_automatic_tags: {
        Args: { guest_id_param: string }
        Returns: undefined
      }
      calculate_guest_stats: {
        Args: { guest_email: string; guest_phone: string }
        Returns: {
          bulk_booking_count: number
          early_bird_count: number
          last_minute_count: number
          last_visit_date: string
          no_show_count: number
          visit_count: number
        }[]
      }
      check_advanced_rate_limit: {
        Args: {
          identifier: string
          max_attempts?: number
          operation_type: string
          threat_level?: string
          window_minutes?: number
        }
        Returns: boolean
      }
      check_rate_limit_enhanced: {
        Args: {
          identifier: string
          max_attempts?: number
          operation_type: string
          window_minutes?: number
        }
        Returns: boolean
      }
      check_returning_guest: {
        Args: {
          check_email: string
          check_phone: string
          check_venue_id: string
        }
        Returns: Json
      }
      cleanup_availability_cache: { Args: never; Returns: undefined }
      compute_booking_time_range: {
        Args: { p_date: string; p_duration_minutes: number; p_time: string }
        Returns: unknown
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
        Args: never
        Returns: {
          event_count: number
          last_event: string
          suspicious_activity: string
          user_id: string
          venue_id: string
        }[]
      }
      expire_pending_payments: { Args: never; Returns: undefined }
      find_duplicate_guests: {
        Args: { guest_email?: string; guest_phone?: string }
        Returns: {
          created_at: string
          email: string
          id: string
          match_type: string
          name: string
          phone: string
        }[]
      }
      generate_booking_reference: { Args: never; Returns: string }
      generate_booking_token: { Args: never; Returns: string }
      generate_verification_code: { Args: never; Returns: string }
      generate_webhook_secret: { Args: never; Returns: string }
      get_current_context: { Args: never; Returns: Json }
      get_security_metrics: { Args: never; Returns: Json }
      get_tag_usage_count: { Args: { tag_id: string }; Returns: number }
      get_user_roles: {
        Args: { _user_id: string; _venue_id: string }
        Returns: string[]
      }
      get_user_venue: { Args: { _user_id: string }; Returns: string }
      guests_search: {
        Args: { _limit?: number; _q: string; _venue: string }
        Returns: {
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
        }[]
        SetofOptions: {
          from: "*"
          to: "guests"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_active_lock: {
        Args: {
          check_time?: string
          p_booking_date: string
          p_service_id: string
          p_start_time: string
          p_venue_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
          _venue_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string; _venue_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      log_security_event: {
        Args: {
          p_event_details?: Json
          p_event_type: string
          p_severity?: string
          p_user_id?: string
          p_venue_id?: string
        }
        Returns: undefined
      }
      merge_guests: {
        Args: { duplicate_guest_id: string; primary_guest_id: string }
        Returns: string
      }
      setup_complete: { Args: never; Returns: boolean }
      setup_venue_atomic: {
        Args: {
          p_email: string
          p_first_name: string
          p_last_name: string
          p_user_id: string
          p_venue_address: string
          p_venue_email: string
          p_venue_name: string
          p_venue_phone: string
          p_venue_slug: string
        }
        Returns: Json
      }
      update_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
          target_venue_id: string
        }
        Returns: boolean
      }
      user_can_create_payment: {
        Args: { _booking_id: number; _user_id: string }
        Returns: boolean
      }
      user_can_manage_venue: {
        Args: { _user_id: string; _venue_id: string }
        Returns: boolean
      }
      verify_code: {
        Args: { submitted_code: string; user_email: string }
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
