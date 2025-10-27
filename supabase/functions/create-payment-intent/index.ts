import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

const createPaymentIntentSchema = z.object({
  bookingData: z.object({
    venueId: z.string().uuid(),
    serviceId: z.string().uuid(),
    date: z.string(),
    time: z.string(),
    partySize: z.number(),
    guest: z.object({
      name: z.string(),
      email: z.string().email(),
      phone: z.string(),
    }),
    notes: z.string().optional().nullable(),
    lockToken: z.string().uuid().optional().nullable(),
    allocation: z.object({
      allocationType: z.enum(['single', 'join']),
      tableId: z.number().optional(),
      tableIds: z.array(z.number()).optional(),
    }),
  }),
  amountCents: z.number().int().positive(),
});

const handler = async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  const corsH = getCorsHeaders(req);

  try {
    const body = await req.json();
    const input = createPaymentIntentSchema.parse(body);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get Stripe keys for venue
    const { data: settings } = await supabase
      .from('venue_stripe_settings')
      .select('is_active, publishable_key_live, secret_key_live, publishable_key_test, secret_key_test, test_mode')
      .eq('venue_id', input.bookingData.venueId)
      .maybeSingle();

    if (!settings || !settings.is_active) {
      return new Response(JSON.stringify({
        ok: false,
        code: 'stripe_not_configured',
        message: 'Payment processing is not available for this venue',
      }), {
        status: 400,
        headers: { ...corsH, 'Content-Type': 'application/json' }
      });
    }

    const publishableKey = settings.test_mode 
      ? settings.publishable_key_test 
      : settings.publishable_key_live;
      
    const secretKey = settings.test_mode 
      ? settings.secret_key_test 
      : settings.secret_key_live;

    if (!publishableKey || !secretKey) {
      return new Response(JSON.stringify({
        ok: false,
        code: 'stripe_keys_missing',
        message: 'Stripe keys are not configured',
      }), {
        status: 400,
        headers: { ...corsH, 'Content-Type': 'application/json' }
      });
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });

    // Get service title for description
    const { data: service } = await supabase
      .from('services')
      .select('title')
      .eq('id', input.bookingData.serviceId)
      .single();

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: input.amountCents,
      currency: 'gbp',
      metadata: {
        venueId: input.bookingData.venueId,
        serviceId: input.bookingData.serviceId,
        serviceTitle: input.bookingData.service || service?.title || 'Reservation',
        date: input.bookingData.date,
        time: input.bookingData.time,
        partySize: input.bookingData.partySize.toString(),
        duration: input.bookingData.duration.toString(),
        endTime: input.bookingData.endTime,
        guestName: input.bookingData.guest.name,
        guestEmail: input.bookingData.guest.email,
        guestPhone: input.bookingData.guest.phone,
        lockToken: input.bookingData.lockToken || '',
        tableId: input.bookingData.allocation.tableId?.toString() || '',
        notes: input.bookingData.notes || '',
        venueName: input.bookingData.venueName,
        venueSlug: input.bookingData.venueSlug,
      },
      receipt_email: input.bookingData.guest.email,
      description: `Reservation deposit for ${input.bookingData.guest.name} on ${input.bookingData.date} at ${input.bookingData.time}`,
    });

    console.log('✅ PaymentIntent created:', paymentIntent.id);

    return new Response(JSON.stringify({
      ok: true,
      clientSecret: paymentIntent.client_secret,
      publishableKey,
      testMode: settings.test_mode,
    }), {
      status: 200,
      headers: { ...corsH, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Create payment intent error:', error);
    return new Response(JSON.stringify({
      ok: false,
      code: 'payment_intent_failed',
      message: error.message,
    }), {
      status: 500,
      headers: { ...corsH, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);
