
// Core application types
export interface Venue {
  id: string;
  slug: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: number;
  label: string;
  seats: number;
  status: 'active' | 'inactive' | 'deleted';
  online_bookable: boolean;
  priority_rank: number;
  venue_id: string;
  section_id?: number;
  position_x?: number;
  position_y?: number;
  join_groups?: number[];
}

export interface Booking {
  id: number;
  table_id?: number;
  guest_name: string;
  party_size: number;
  booking_date: string;
  booking_time: string;
  status: 'confirmed' | 'seated' | 'finished' | 'cancelled' | 'late';
  is_unallocated: boolean;
  original_table_id?: number;
  phone?: string;
  email?: string;
  notes?: string;
  service: string;
  duration_minutes: number;
  end_time: string;
  booking_reference?: string;
  venue_id: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  title: string;
  description?: string;
  min_guests: number;
  max_guests: number;
  requires_deposit: boolean;
  deposit_per_guest: number;
  charge_type: 'none' | 'per_person' | 'flat_rate';
  charge_amount_per_guest: number;
  minimum_guests_for_charge?: number;
  requires_payment: boolean;
  lead_time_hours: number;
  cancellation_window_hours: number;
  active: boolean;
  online_bookable: boolean;
  venue_id: string;
  image_url?: string;
  terms_and_conditions?: string;
}

export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  opt_in_marketing: boolean;
  venue_id: string;
  created_at: string;
  updated_at: string;
}

export interface BookingWindow {
  id: string;
  venue_id: string;
  service_id: string;
  days: string[];
  start_time: string;
  end_time: string;
  max_bookings_per_slot: number;
  start_date?: string;
  end_date?: string;
  blackout_periods?: any[];
}
