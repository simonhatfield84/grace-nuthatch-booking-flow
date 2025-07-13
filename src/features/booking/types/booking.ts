
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
