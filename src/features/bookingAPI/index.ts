import { supabase } from '@/integrations/supabase/client';

export interface Service {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  requires_payment: boolean;
  requires_deposit?: boolean;
  min_guests: number;
  max_guests: number;
  duration_rules: Array<{
    minGuests: number;
    maxGuests: number;
    durationMinutes: number;
  }>;
}

export interface AvailabilityResponse {
  ok: boolean;
  availability: Record<string, string[]>; // date -> times[]
  duration: number;
}

export interface LockResponse {
  ok: boolean;
  lockToken?: string;
  expiresAt?: string;
  holdMinutes?: number;
  code?: string;
  message?: string;
}

export interface PrepareBookingResponse {
  ok: boolean;
  requiresPayment: boolean;
  amountCents?: number;
  bookingData?: {
    venueId: string;
    serviceId: string;
    date: string;
    time: string;
    partySize: number;
    duration: number;
    endTime: string;
    guest: { name: string; email: string; phone: string };
    notes: string | null;
    lockToken: string | null;
    allocation: { tableId: number };
    service: string;
    venueName: string;
    venueSlug: string;
  };
  booking?: {
    id: number;
    reference: string;
    status: string;
  };
  code?: string;
  error?: string;
}

export interface PaymentIntentResponse {
  ok: boolean;
  clientSecret?: string;
  publishableKey?: string;
  testMode?: boolean;
  code?: string;
  message?: string;
}

/**
 * Fetch services available for a venue on a specific date/party size
 */
export async function fetchServices(
  venueSlug: string,
  partySize: number,
  date: string
): Promise<Service[]> {
  const { data, error } = await supabase.functions.invoke('fetch-services', {
    body: { venueSlug, partySize, date }
  });

  if (error) throw error;
  if (!data.ok) throw new Error(data.message || 'Failed to fetch services');

  return data.services;
}

/**
 * Fetch calendar availability for a service/party size/month
 */
export async function fetchCalendar(
  venueSlug: string,
  serviceId: string,
  partySize: number,
  month: string // YYYY-MM
): Promise<AvailabilityResponse> {
  const { data, error } = await supabase.functions.invoke('check-availability', {
    body: { venueSlug, serviceId, partySize, month }
  });

  if (error) throw error;
  return data;
}

/**
 * Fetch time slots for a specific date
 */
export async function fetchTimeSlots(
  venueSlug: string,
  serviceId: string,
  partySize: number,
  date: string
): Promise<string[]> {
  const { data, error } = await supabase.functions.invoke('check-availability', {
    body: { venueSlug, serviceId, partySize, date }
  });

  if (error) throw error;
  if (!data.ok) throw new Error(data.message || 'Failed to fetch time slots');

  return data.availability[date] || [];
}

/**
 * Create a lock for a time slot
 */
export async function createLock(
  venueSlug: string,
  serviceId: string,
  date: string,
  time: string,
  partySize: number
): Promise<LockResponse> {
  const { data, error } = await supabase.functions.invoke('locks', {
    body: {
      action: 'create',
      venueSlug,
      serviceId,
      date,
      time,
      partySize,
    }
  });

  if (error) throw error;
  return data;
}

/**
 * Extend an existing lock
 */
export async function extendLock(lockToken: string): Promise<LockResponse> {
  const { data, error } = await supabase.functions.invoke('locks', {
    body: {
      action: 'extend',
      lockToken,
    }
  });

  if (error) throw error;
  return data;
}

/**
 * Release a lock
 */
export async function releaseLock(lockToken: string): Promise<void> {
  await supabase.functions.invoke('locks', {
    body: {
      action: 'release',
      lockToken,
      reason: 'user_released',
    }
  });
}

/**
 * Prepare booking - determine if payment required
 */
export async function prepareBooking(
  venueSlug: string,
  payload: {
    serviceId: string;
    date: string;
    time: string;
    partySize: number;
    guest: {
      name: string;
      email: string;
      phone: string;
    };
    notes?: string;
    lockToken?: string;
  }
): Promise<PrepareBookingResponse> {
  const { data, error } = await supabase.functions.invoke('booking-submit', {
    body: {
      venueSlug,
      ...payload,
    }
  });

  if (error) throw error;
  return data;
}

/**
 * Create payment intent for a booking
 */
export async function createPaymentIntent(
  bookingData: any,
  amountCents: number
): Promise<PaymentIntentResponse> {
  const { data, error } = await supabase.functions.invoke('create-payment-intent', {
    body: {
      bookingData,
      amountCents,
    }
  });

  if (error) throw error;
  return data;
}
