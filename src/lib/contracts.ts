import { z } from 'zod';

/**
 * Runtime API Contracts - Version 1
 * 
 * These schemas define the expected structure for all critical API interactions.
 * Changes to these contracts require versioning (v2, v3, etc.) and maintaining
 * backwards compatibility with existing integrations.
 * 
 * Last updated: 2025-10-26
 */

// ============= AVAILABILITY CONTRACTS =============

export const AvailabilityRequestV1 = z.object({
  venueSlug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  serviceId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  partySize: z.number().int().min(1).max(100),
});

export const TimeSlotV1 = z.object({
  time: z.string().regex(/^\d{2}:\d{2}$/),
  available: z.boolean(),
});

export const AvailabilityResponseV1 = z.object({
  ok: z.boolean(),
  venueId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  partySize: z.number().int().optional(),
  slots: z.array(TimeSlotV1).optional(),
  cached: z.boolean().optional(),
  took_ms: z.number().optional(),
  code: z.string().optional(),
  message: z.string().optional(),
});

// ============= LOCK CONTRACTS =============

export const LockCreateRequestV1 = z.object({
  venueSlug: z.string().min(1).max(100),
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  partySize: z.number().int().min(1).max(100),
  clientFingerprint: z.string().optional(),
});

export const LockCreateResponseV1 = z.object({
  ok: z.boolean(),
  lockToken: z.string().optional(),
  expiresAt: z.string().optional(),
  holdMinutes: z.number().optional(),
  code: z.string().optional(),
  message: z.string().optional(),
});

export const LockExtendRequestV1 = z.object({
  lockToken: z.string(),
});

export const LockExtendResponseV1 = z.object({
  ok: z.boolean(),
  expiresAt: z.string().optional(),
  code: z.string().optional(),
  message: z.string().optional(),
});

export const LockReleaseRequestV1 = z.object({
  lockToken: z.string().optional(),
  lockId: z.string().optional(),
  reason: z.string().optional(),
});

export const LockReleaseResponseV1 = z.object({
  ok: z.boolean(),
  message: z.string().optional(),
  code: z.string().optional(),
  lock: z.object({
    id: z.string(),
    venue_id: z.string().optional(),
    booking_date: z.string().optional(),
    start_time: z.string().optional(),
    released_at: z.string().optional(),
  }).optional(),
});

// ============= BOOKING CONTRACTS =============

export const BookingCreateRequestV1 = z.object({
  booking: z.object({
    guest_name: z.string().min(2).max(100),
    email: z.string().email().max(254),
    phone: z.string().regex(/^[\d\s\-\+\(\)]{7,20}$/),
    party_size: z.number().int().min(1).max(100),
    booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    booking_time: z.string().regex(/^\d{2}:\d{2}$/),
    service: z.string().min(1).max(100),
    service_id: z.string().uuid().nullable().optional(),
    notes: z.string().max(500).nullable().optional(),
    venue_id: z.string().uuid(),
    status: z.enum(['pending_payment', 'confirmed']).optional(),
    table_id: z.number().int().nullable().optional(),
    is_unallocated: z.boolean().optional(),
    source: z.enum(['widget', 'admin', 'walkin']).optional(),
  }),
  lockToken: z.string().uuid().nullable(),
});

export const BookingCreateResponseV1 = z.object({
  booking: z.object({
    id: z.number().int(),
    booking_reference: z.string(),
    guest_name: z.string(),
    party_size: z.number(),
    booking_date: z.string(),
    booking_time: z.string(),
  }),
  reqId: z.string(),
});

// ============= STRIPE SETTINGS CONTRACTS =============

export const StripeSettingsRequestV1 = z.object({
  venueSlug: z.string().min(1).max(100),
});

export const StripeSettingsResponseV1 = z.object({
  ok: z.boolean(),
  publishableKey: z.string().optional(),
  testMode: z.boolean().optional(),
  active: z.boolean().optional(),
  code: z.string().optional(),
  message: z.string().optional(),
});

// ============= CONTRACT VERSIONS =============

export const CONTRACTS_VERSION = 'v1';

// ============= TYPE EXPORTS =============

export type AvailabilityRequestV1Type = z.infer<typeof AvailabilityRequestV1>;
export type AvailabilityResponseV1Type = z.infer<typeof AvailabilityResponseV1>;
export type TimeSlotV1Type = z.infer<typeof TimeSlotV1>;

export type LockCreateRequestV1Type = z.infer<typeof LockCreateRequestV1>;
export type LockCreateResponseV1Type = z.infer<typeof LockCreateResponseV1>;
export type LockExtendRequestV1Type = z.infer<typeof LockExtendRequestV1>;
export type LockExtendResponseV1Type = z.infer<typeof LockExtendResponseV1>;
export type LockReleaseRequestV1Type = z.infer<typeof LockReleaseRequestV1>;
export type LockReleaseResponseV1Type = z.infer<typeof LockReleaseResponseV1>;

export type BookingCreateRequestV1Type = z.infer<typeof BookingCreateRequestV1>;
export type BookingCreateResponseV1Type = z.infer<typeof BookingCreateResponseV1>;

export type StripeSettingsRequestV1Type = z.infer<typeof StripeSettingsRequestV1>;
export type StripeSettingsResponseV1Type = z.infer<typeof StripeSettingsResponseV1>;
