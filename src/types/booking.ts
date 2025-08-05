
export interface Booking {
  // Core properties (always present)
  id: number;
  guest_name: string;
  party_size: number;
  booking_date: string;
  booking_time: string;
  status: 'confirmed' | 'seated' | 'finished' | 'cancelled' | 'late' | 'pending_payment' | 'incomplete' | 'no_show';
  service: string;
  duration_minutes: number;
  end_time: string;
  venue_id: string;
  created_at: string;
  updated_at: string;
  
  // Table allocation properties
  table_id: number | null;
  is_unallocated: boolean;
  original_table_id: number | null;
  
  // Optional properties
  phone: string | null;
  email: string | null;
  notes: string | null;
  booking_reference: string | null;
}
