
import { z } from "zod";

// Common validation schemas
export const emailSchema = z.string().email().max(254);
export const phoneSchema = z.string().regex(/^[\d\s\-\+\(\)]{7,20}$/).optional();
export const uuidSchema = z.string().uuid();
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);

// Booking validation schema
export const bookingCreateSchema = z.object({
  guest_name: z.string().min(2).max(100).trim(),
  email: emailSchema.optional(),
  phone: phoneSchema,
  party_size: z.number().int().min(1).max(50),
  booking_date: dateSchema,
  booking_time: timeSchema,
  service: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  venue_id: uuidSchema,
});

// Payment validation schema
export const paymentIntentSchema = z.object({
  bookingId: z.number().int().positive(),
  amount: z.number().positive().max(10000), // Max £100
  currency: z.string().length(3).default('gbp'),
  description: z.string().max(200).optional(),
});

// Webhook validation schema
export const stripeWebhookSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.any(),
  }),
  created: z.number(),
});

// Security audit schema
export const securityEventSchema = z.object({
  event_type: z.enum(['login_attempt', 'login_success', 'login_failure', 'password_reset', 'data_access', 'permission_denied', 'webhook_received', 'booking_created']),
  event_details: z.record(z.any()),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  venue_id: uuidSchema.optional(),
});

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type PaymentIntentInput = z.infer<typeof paymentIntentSchema>;
export type StripeWebhookInput = z.infer<typeof stripeWebhookSchema>;
export type SecurityEventInput = z.infer<typeof securityEventSchema>;
