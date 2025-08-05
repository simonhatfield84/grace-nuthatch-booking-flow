
export interface BookingStep {
  id: string;
  name: string;
  component: React.ComponentType<any>;
  isValid: boolean;
  isCompleted: boolean;
}

export interface BookingData {
  partySize: number;
  date: Date | null;
  time: string;
  service: Service | null;
  guestDetails: GuestDetails | null;
  paymentRequired: boolean;
  paymentAmount: number;
  bookingId: number | null;
}

export interface Service {
  id: string;
  title: string;
  description?: string;
  min_guests: number;
  max_guests: number;
  requires_deposit: boolean;
  deposit_per_guest: number;
  lead_time_hours: number;
  image_url?: string;
}

export interface GuestDetails {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  marketingOptIn: boolean;
  termsAccepted: boolean;
}

export interface AvailabilitySlot {
  time: string;
  available: boolean;
  reason?: string;
}

export interface BookingValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Updated booking interface to match the one used in HostInterface
export interface Booking {
  id: number;
  table_id: number | null;
  guest_name: string;
  party_size: number;
  booking_date: string;
  booking_time: string;
  status: 'confirmed' | 'seated' | 'finished' | 'cancelled' | 'late' | 'pending_payment' | 'no_show' | 'incomplete';
  is_unallocated: boolean;
  original_table_id: number | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  service: string;
  duration_minutes: number;
  end_time: string;
  booking_reference: string | null;
  created_at: string;
  updated_at: string;
  venue_id: string;
}
