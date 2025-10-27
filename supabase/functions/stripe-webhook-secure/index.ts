import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { createErrorResponse, corsHeaders } from '../_shared/errorSanitizer.ts';

// Inline security utilities for edge function
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

class AdvancedRateLimiter {
  private static limits = new Map<string, { count: number; resetTime: number; level: 'low' | 'medium' | 'high' }>();

  static async checkLimit(
    identifier: string, 
    config: RateLimitConfig,
    threatLevel: 'low' | 'medium' | 'high' = 'low'
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const key = `${identifier}-${config.windowMs}`;
    
    const adjustedMax = threatLevel === 'high' ? Math.floor(config.maxRequests * 0.5) : 
                      threatLevel === 'medium' ? Math.floor(config.maxRequests * 0.75) : 
                      config.maxRequests;

    let limit = this.limits.get(key);
    
    if (!limit || now >= limit.resetTime) {
      limit = { 
        count: 1, 
        resetTime: now + config.windowMs,
        level: threatLevel 
      };
      this.limits.set(key, limit);
      return { allowed: true, remaining: adjustedMax - 1, resetTime: limit.resetTime };
    }

    if (limit.count >= adjustedMax) {
      return { allowed: false, remaining: 0, resetTime: limit.resetTime };
    }

    limit.count++;
    this.limits.set(key, limit);
    return { allowed: true, remaining: adjustedMax - limit.count, resetTime: limit.resetTime };
  }

  static getClientIdentifier(req: Request): string {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';
    return `${ip}-${userAgent.slice(0, 50)}`;
  }
}

async function logSecurityEvent(
  supabase: any,
  eventType: string,
  details: Record<string, any>,
  req: Request,
  venueId?: string
) {
  try {
    await supabase
      .from('security_audit')
      .insert({
        event_type: eventType,
        event_details: details,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent'),
        venue_id: venueId,
      });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

async function logWebhookEvent(
  supabase: any,
  stripeEventId: string,
  eventType: string,
  venueId: string,
  bookingId?: number,
  status: string = 'processed',
  errorMessage?: string,
  rawData?: any
) {
  try {
    await supabase
      .from('webhook_events')
      .insert({
        stripe_event_id: stripeEventId,
        event_type: eventType,
        venue_id: venueId,
        booking_id: bookingId,
        status: status,
        error_message: errorMessage,
        raw_data: rawData
      });
    console.log(`✅ Webhook event logged: ${stripeEventId}`);
  } catch (error) {
    console.error('❌ Failed to log webhook event:', error);
  }
}

async function upsertRetryQueue(
  supabase: any,
  stripeEventId: string,
  eventType: string,
  venueId: string,
  payload: any,
  error: Error
) {
  try {
    const { data: existing } = await supabase
      .from('webhook_retry_queue')
      .select('retry_count')
      .eq('stripe_event_id', stripeEventId)
      .single();

    const retryCount = existing ? existing.retry_count + 1 : 1;
    const backoffMinutes = 2 * Math.pow(2, Math.min(retryCount - 1, 6));
    
    const nextAttempt = retryCount > 10 
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : new Date(Date.now() + backoffMinutes * 60 * 1000);

    const { error: upsertError } = await supabase
      .from('webhook_retry_queue')
      .upsert({
        stripe_event_id: stripeEventId,
        event_type: eventType,
        venue_id: venueId,
        payload: payload,
        last_error: error.message,
        retry_count: retryCount,
        next_attempt_at: nextAttempt.toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'stripe_event_id'
      });

    if (upsertError) {
      console.error('❌ Failed to upsert retry queue:', upsertError);
    } else {
      console.log(`🔄 Queued for retry (attempt ${retryCount}), next at ${nextAttempt.toISOString()}`);
    }
  } catch (err) {
    console.error('💥 Error upserting retry queue:', err);
  }
}

async function removeFromRetryQueue(supabase: any, stripeEventId: string) {
  try {
    const { error } = await supabase
      .from('webhook_retry_queue')
      .delete()
      .eq('stripe_event_id', stripeEventId);

    if (error) {
      console.error('❌ Failed to remove from retry queue:', error);
    } else {
      console.log('✅ Removed from retry queue:', stripeEventId);
    }
  } catch (err) {
    console.error('💥 Error removing from retry queue:', err);
  }
}

function detectThreatLevel(req: Request, identifier: string): 'low' | 'medium' | 'high' {
  const userAgent = req.headers.get('user-agent') || '';
  const referer = req.headers.get('referer') || '';
  
  if (
    userAgent.includes('bot') ||
    userAgent.includes('crawler') ||
    userAgent.length < 10 ||
    !referer.includes(req.headers.get('origin') || '')
  ) {
    return 'high';
  }
  
  if (userAgent.includes('curl') || userAgent.includes('wget')) {
    return 'medium';
  }
  
  return 'low';
}

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔒 Enhanced Stripe webhook received');

    // Advanced rate limiting with threat detection
    const clientId = AdvancedRateLimiter.getClientIdentifier(req);
    const threatLevel = detectThreatLevel(req, clientId);
    
    const rateLimitResult = await AdvancedRateLimiter.checkLimit(
      clientId,
      { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 requests per 15 minutes
      threatLevel
    );

    if (!rateLimitResult.allowed) {
      console.error('🚫 Rate limit exceeded for webhook');
      return new Response('Rate limit exceeded', { status: 429, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('❌ Missing Stripe signature');
      await logSecurityEvent(supabaseAdmin, 'webhook_received', {
        error: 'missing_signature',
        threat_level: threatLevel
      }, req);
      return new Response('Missing signature', { status: 400, headers: corsHeaders });
    }

    // Parse the webhook payload
    let event: StripeEvent;
    try {
      event = JSON.parse(body);
    } catch (err) {
      console.error('❌ Invalid JSON:', err);
      await logSecurityEvent(supabaseAdmin, 'webhook_received', {
        error: 'invalid_json',
        threat_level: threatLevel
      }, req);
      return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
    }

    console.log('📋 Processing webhook event:', event.type, 'for object:', event.data.object.id);

    // Extract venue ID - ENHANCED LOGIC FOR BOOKING PAYMENTS
    let venueId: string | null = null;

    // Method 1: Check metadata for booking payments (payment_intent events)
    if (event.type.includes('payment_intent') && event.data.object.metadata?.venue_id) {
      venueId = event.data.object.metadata.venue_id;
      console.log('🎯 Found venue from payment intent metadata:', venueId);
    }
    
    // Method 2: Check customer ID for subscription events
    if (!venueId) {
      const customerId = event.data.object.customer;
      const subscriptionId = event.data.object.id;

      if (subscriptionId && event.type.includes('subscription')) {
        const { data: subscription } = await supabaseAdmin
          .from('venue_subscriptions')
          .select('venue_id, venues!inner(id)')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (subscription) {
          venueId = subscription.venue_id;
          console.log('🏢 Found venue from subscription:', venueId);
        }
      }

      if (!venueId && customerId) {
        const { data: subscription } = await supabaseAdmin
          .from('venue_subscriptions')
          .select('venue_id, venues!inner(id)')
          .eq('stripe_customer_id', customerId)
          .single();

        if (subscription) {
          venueId = subscription.venue_id;
          console.log('🏢 Found venue from customer:', venueId);
        }
      }
    }

    if (!venueId) {
      console.error('❌ Could not find venue for webhook');
      await logSecurityEvent(supabaseAdmin, 'webhook_received', {
        error: 'venue_not_found',
        stripe_event_id: event.id,
        threat_level: threatLevel,
        event_type: event.type,
        object_id: event.data.object.id
      }, req);
      return new Response('Venue not found', { status: 400, headers: corsHeaders });
    }

    // Get the webhook secret for this venue
    const { data: stripeSettings } = await supabaseAdmin
      .from('venue_stripe_settings')
      .select('webhook_secret_test, webhook_secret_live, test_mode')
      .eq('venue_id', venueId)
      .single();

    if (!stripeSettings) {
      console.error('❌ No Stripe settings found for venue:', venueId);
      await logSecurityEvent(supabaseAdmin, 'webhook_received', {
        error: 'no_stripe_settings',
        venue_id: venueId,
        threat_level: threatLevel
      }, req, venueId);
      return new Response('Stripe settings not found', { status: 400, headers: corsHeaders });
    }

    // Select the appropriate webhook secret based on test mode
    const webhookSecret = stripeSettings.test_mode 
      ? stripeSettings.webhook_secret_test 
      : stripeSettings.webhook_secret_live;

    if (!webhookSecret) {
      console.error('❌ No webhook secret configured for venue:', venueId);
      await logSecurityEvent(supabaseAdmin, 'webhook_received', {
        error: 'no_webhook_secret',
        venue_id: venueId,
        threat_level: threatLevel,
        test_mode: stripeSettings.test_mode
      }, req, venueId);
      return new Response('Webhook secret not configured', { status: 400, headers: corsHeaders });
    }

    // Proper Stripe webhook signature verification
    const sigElements = signature.split(',');
    const timestamp = sigElements.find(el => el.startsWith('t='))?.substring(2);
    const sig = sigElements.find(el => el.startsWith('v1='))?.substring(3);

    if (!timestamp || !sig) {
      console.error('❌ Invalid signature format');
      await logSecurityEvent(supabaseAdmin, 'webhook_received', {
        error: 'invalid_signature_format',
        venue_id: venueId,
        threat_level: threatLevel
      }, req, venueId);
      return new Response('Invalid signature format', { status: 400, headers: corsHeaders });
    }

    // Check timestamp to prevent replay attacks (5 minutes tolerance)
    const eventTime = parseInt(timestamp) * 1000;
    const currentTime = Date.now();
    const timeDiff = Math.abs(currentTime - eventTime);

    if (timeDiff > 5 * 60 * 1000) { // 5 minutes
      console.error('❌ Webhook timestamp too old');
      await logSecurityEvent(supabaseAdmin, 'webhook_received', {
        error: 'timestamp_too_old',
        venue_id: venueId,
        time_diff: timeDiff,
        threat_level: threatLevel
      }, req, venueId);
      return new Response('Webhook timestamp too old', { status: 400, headers: corsHeaders });
    }

    // Verify the webhook signature using proper HMAC-SHA256
    const payloadForSignature = timestamp + '.' + body;
    const expectedSignature = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ).then(key =>
      crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadForSignature))
    ).then(signature => 
      Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    );

    if (sig !== expectedSignature) {
      console.error('❌ Invalid webhook signature');
      await logSecurityEvent(supabaseAdmin, 'webhook_received', {
        error: 'invalid_signature',
        venue_id: venueId,
        threat_level: threatLevel
      }, req, venueId);
      return new Response('Invalid signature', { status: 400, headers: corsHeaders });
    }

    // Check for duplicate events (prevent replay attacks)
    const { data: existingEvent } = await supabaseAdmin
      .from('webhook_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .eq('venue_id', venueId)
      .single();

    if (existingEvent) {
      console.log('📋 Duplicate webhook event detected, ignoring');
      return new Response('Duplicate event', { status: 200, headers: corsHeaders });
    }

    // Log the verified webhook event for security audit
    await logSecurityEvent(supabaseAdmin, 'webhook_received', {
      stripe_event_type: event.type,
      stripe_event_id: event.id,
      timestamp: timestamp,
      verified: true,
      threat_level: threatLevel
    }, req, venueId);

    // Process the webhook event based on type
    let bookingId: number | undefined;
    let webhookStatus = 'processed';
    let errorMessage: string | undefined;

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          bookingId = await handlePaymentSuccess(supabaseAdmin, event, venueId);
          break;
        case 'payment_intent.payment_failed':
          bookingId = await handlePaymentFailure(supabaseAdmin, event, venueId);
          break;
        case 'invoice.payment_succeeded':
          await handleSubscriptionPayment(supabaseAdmin, event, venueId);
          break;
        default:
          console.log(`📋 Unhandled event type: ${event.type}`);
      }

      // ✅ SUCCESS: Remove from retry queue if exists
      await removeFromRetryQueue(supabaseAdmin, event.id);

    } catch (error) {
      console.error('❌ Error processing webhook event:', error);
      webhookStatus = 'failed';
      errorMessage = error.message;

      // ❌ FAILURE: Add to retry queue with exponential backoff
      await upsertRetryQueue(
        supabaseAdmin,
        event.id,
        event.type,
        venueId,
        event.data,
        error
      );
    }

    // Log webhook event processing (always log, even on failure)
    await logWebhookEvent(
      supabaseAdmin,
      event.id,
      event.type,
      venueId,
      bookingId,
      webhookStatus,
      errorMessage,
      event.data
    );

    console.log('✅ Webhook processed successfully');
    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('💥 Webhook error:', error);
    return createErrorResponse(error, 500);
  }
};

async function handlePaymentSuccess(supabase: any, event: StripeEvent, venueId: string): Promise<number | undefined> {
  const paymentIntent = event.data.object;
  const metadata = paymentIntent.metadata;
  
  console.log('💰 Processing payment success:', paymentIntent.id);

  try {
    // Extract booking data from metadata
    const bookingData = {
      venueId: metadata.venueId || venueId,
      serviceId: metadata.serviceId,
      date: metadata.date,
      time: metadata.time,
      endTime: metadata.endTime,
      partySize: parseInt(metadata.partySize),
      duration: parseInt(metadata.duration),
      tableId: parseInt(metadata.tableId),
      guest: {
        name: metadata.guestName,
        email: metadata.guestEmail,
        phone: metadata.guestPhone,
      },
      notes: metadata.notes || null,
      lockToken: metadata.lockToken || null,
      service: metadata.serviceTitle,
    };

    console.log('📋 Extracted booking data from PaymentIntent:', bookingData);

    // Re-run allocation to ensure table is still available
    const { findAvailableTable } = await import('../_shared/tableAllocation.ts');
    
    const allocation = await findAvailableTable(supabase, {
      venueId: bookingData.venueId,
      date: bookingData.date,
      time: bookingData.time,
      partySize: bookingData.partySize,
      duration: bookingData.duration,
    });

    if (!allocation.available) {
      console.error('❌ Table no longer available after payment');
      
      // Create cancelled booking entry for Host visibility
      await supabase.from('bookings').insert({
        venue_id: bookingData.venueId,
        service_id: bookingData.serviceId,
        service: bookingData.service,
        guest_name: bookingData.guest.name,
        email: bookingData.guest.email,
        phone: bookingData.guest.phone,
        party_size: bookingData.partySize,
        booking_date: bookingData.date,
        booking_time: bookingData.time,
        end_time: bookingData.endTime,
        duration_minutes: bookingData.duration,
        status: 'cancelled',
        source: 'widget',
        notes: 'Payment succeeded but table no longer available',
        payment_intent_id: paymentIntent.id,
        payment_amount: paymentIntent.amount,
      });

      // TODO: Trigger auto-refund here
      throw new Error('Table no longer available after payment');
    }

    // Create NEW confirmed booking (not update existing)
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        venue_id: bookingData.venueId,
        service_id: bookingData.serviceId,
        service: bookingData.service,
        guest_name: bookingData.guest.name,
        email: bookingData.guest.email,
        phone: bookingData.guest.phone,
        party_size: bookingData.partySize,
        booking_date: bookingData.date,
        booking_time: bookingData.time,
        end_time: bookingData.endTime,
        duration_minutes: bookingData.duration,
        table_id: allocation.tableId,
        is_unallocated: false,
        source: 'widget',
        status: 'confirmed',
        notes: bookingData.notes,
        payment_intent_id: paymentIntent.id,
        payment_amount: paymentIntent.amount,
      })
      .select('id, booking_reference')
      .single();

    if (bookingError) {
      console.error('❌ Failed to create booking:', bookingError);
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    console.log('✅ Booking created:', booking.id, booking.booking_reference);

    // Create payment record
    await supabase.from('booking_payments').insert({
      booking_id: booking.id,
      venue_id: bookingData.venueId,
      stripe_payment_intent_id: paymentIntent.id,
      amount_cents: paymentIntent.amount,
      status: 'succeeded',
      payment_method_type: paymentIntent.payment_method?.type || 'card',
      processed_at: new Date().toISOString(),
    });

    console.log('✅ Payment record created');

    // Release lock
    if (bookingData.lockToken) {
      await supabase
        .from('booking_locks')
        .update({
          released_at: new Date().toISOString(),
          reason: 'payment_succeeded',
        })
        .eq('lock_token', bookingData.lockToken);
      
      console.log('🔓 Lock released:', bookingData.lockToken);
    }

    // Create audit log
    await supabase.from('booking_audit').insert({
      booking_id: booking.id,
      venue_id: bookingData.venueId,
      change_type: 'created',
      source_type: 'webhook',
      source_details: {
        payment_intent_id: paymentIntent.id,
        amount_cents: paymentIntent.amount,
      }
    });

    // Send confirmation email
    await sendBookingConfirmationEmail(supabase, booking.id, bookingData.venueId);

    console.log('💰 Payment succeeded processing complete:', paymentIntent.id);
    return booking.id;

  } catch (error) {
    console.error('💥 Error in handlePaymentSuccess:', error);
    throw error;
  }
}

async function sendBookingConfirmationEmail(supabase: any, bookingId: number, venueId: string) {
  console.log('📧 Attempting to send booking confirmation email for booking:', bookingId);
  
  let emailStatus = 'not_applicable';
  let emailError = null;
  let notificationDetails = {};

  try {
    // Get booking details including venue information
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        venues!inner(name, slug)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('❌ Failed to fetch booking details:', bookingError);
      emailStatus = 'failed';
      emailError = 'Failed to fetch booking details';
    } else if (!booking.email) {
      console.log('📧 No email address for booking, skipping email');
      emailStatus = 'not_applicable';
    } else {
      console.log('📧 Sending confirmation email to:', booking.email);
      
      // Send email via the send-email function with proper error handling
      const { data: emailResult, error: emailSendError } = await supabase.functions.invoke('send-email', {
        body: {
          booking_id: booking.id,
          guest_email: booking.email,
          venue_id: venueId,
          email_type: 'booking_confirmation',
        }
      });

      console.log('📧 Email function response:', { data: emailResult, error: emailSendError });

      // Check for function invocation errors
      if (emailSendError) {
        console.error('❌ Function invocation error:', emailSendError);
        emailStatus = 'failed';
        emailError = emailSendError.message || 'Function invocation failed';
        notificationDetails = {
          email_type: 'booking_confirmation',
          error_type: 'function_error',
          error_message: emailSendError.message,
          recipient: booking.email
        };
      }
      // Check for email service errors (when function runs but email fails)
      else if (emailResult && !emailResult.success) {
        console.error('❌ Email service error:', emailResult.error);
        emailStatus = 'failed';
        emailError = emailResult.error || 'Email service error';
        notificationDetails = {
          email_type: 'booking_confirmation',
          error_type: 'email_service_error',
          error_message: emailResult.error,
          recipient: booking.email,
          details: emailResult.details
        };
      }
      // Success case
      else if (emailResult && emailResult.success) {
        console.log('✅ Confirmation email sent successfully with ID:', emailResult.id);
        emailStatus = 'sent';
        notificationDetails = {
          email_type: 'booking_confirmation',
          recipient: booking.email,
          sent_at: new Date().toISOString(),
          email_id: emailResult.id
        };
      }
      // Unexpected response format
      else {
        console.error('❌ Unexpected email response format:', emailResult);
        emailStatus = 'failed';
        emailError = 'Unexpected response format';
        notificationDetails = {
          email_type: 'booking_confirmation',
          error_type: 'unexpected_response',
          error_message: 'Unexpected response format',
          recipient: booking.email,
          response: emailResult
        };
      }
    }
  } catch (error) {
    console.error('💥 Error in sendBookingConfirmationEmail:', error);
    emailStatus = 'failed';
    emailError = error.message;
    notificationDetails = {
      email_type: 'booking_confirmation',
      error_type: 'exception',
      error_message: error.message,
      stack_trace: error.stack
    };
  }

  // Log audit entry for email attempt with accurate status
  try {
    await supabase
      .from('booking_audit')
      .insert([{
        booking_id: bookingId,
        change_type: emailStatus === 'sent' ? 'email_sent' : 'email_failed',
        changed_by: 'system',
        notes: emailStatus === 'sent' 
          ? 'Booking confirmation email sent after successful payment'
          : `Failed to send confirmation email: ${emailError}`,
        venue_id: venueId,
        source_type: 'system_automatic',
        source_details: {
          trigger: 'payment_success_webhook',
          payment_processor: 'stripe'
        },
        email_status: emailStatus,
        notification_details: notificationDetails
      }]);
    
    console.log('✅ Email audit entry logged with status:', emailStatus);
  } catch (auditError) {
    console.error('❌ Failed to log email audit entry:', auditError);
  }
}

async function handlePaymentFailure(supabase: any, event: StripeEvent, venueId: string): Promise<number | undefined> {
  const paymentIntentId = event.data.object.id;
  const metadata = event.data.object.metadata;
  
  console.log('❌ Processing payment failure:', paymentIntentId);
  
  // Create cancelled booking entry for Host visibility
  const { data: booking } = await supabase.from('bookings').insert({
    venue_id: metadata.venueId || venueId,
    service_id: metadata.serviceId,
    service: metadata.serviceTitle,
    guest_name: metadata.guestName,
    email: metadata.guestEmail,
    phone: metadata.guestPhone,
    party_size: parseInt(metadata.partySize),
    booking_date: metadata.date,
    booking_time: metadata.time,
    end_time: metadata.endTime,
    duration_minutes: parseInt(metadata.duration),
    status: 'cancelled',
    source: 'widget',
    notes: 'Payment failed',
    payment_intent_id: paymentIntentId,
  }).select('id').single();

  console.log('📋 Cancelled booking entry created for payment failure');

  // Release lock
  if (metadata.lockToken) {
    await supabase
      .from('booking_locks')
      .update({
        released_at: new Date().toISOString(),
        reason: 'payment_failed',
      })
      .eq('lock_token', metadata.lockToken);
    
    console.log('🔓 Lock released:', metadata.lockToken);
  }

  console.log('❌ Payment failed processing complete:', paymentIntentId);
  return booking?.id;
}

async function handleSubscriptionPayment(supabase: any, event: StripeEvent, venueId: string) {
  const invoice = event.data.object;
  
  console.log('💰 Processing subscription payment:', invoice.id);
  
  await supabase
    .from('payment_transactions')
    .insert({
      venue_id: venueId,
      amount_cents: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      stripe_invoice_id: invoice.id,
      payment_method: invoice.payment_intent?.payment_method_types?.[0] || 'unknown',
      processed_at: new Date().toISOString()
    });

  console.log('💰 Subscription payment succeeded:', invoice.id);
}

serve(handler);
