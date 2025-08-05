
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
  bookingId: number | null;
}

export interface BookingFormData {
  partySize: number;
  date: Date;
  time: string;
  serviceTitle?: string;
  guestDetails: GuestDetails;
}

export interface Service {
  id: string;
  title: string;
  description?: string;
  min_guests: number;
  max_guests: number;
  lead_time_hours: number;
  image_url?: string;
}

export interface GuestDetails {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  specialRequests?: string;
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
