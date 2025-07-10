
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { AdvancedRateLimiter, logSecurityEvent, detectThreatLevel } from "../../src/utils/securityUtils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

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

    // Get venue-specific webhook secret based on the customer ID or subscription ID
    const customerId = event.data.object.customer;
    const subscriptionId = event.data.object.id;

    // Find the venue for this webhook
    let venueWebhookSecret: string | null = null;
    let venueId: string | null = null;

    // Try to find venue by subscription ID first
    if (subscriptionId && event.type.includes('subscription')) {
      const { data: subscription } = await supabaseAdmin
        .from('venue_subscriptions')
        .select('venue_id, venues!inner(id)')
        .eq('stripe_subscription_id', subscriptionId)
        .single();

      if (subscription) {
        venueId = subscription.venue_id;
      }
    }

    // Try to find venue by customer ID
    if (!venueId && customerId) {
      const { data: subscription } = await supabaseAdmin
        .from('venue_subscriptions')
        .select('venue_id, venues!inner(id)')
        .eq('stripe_customer_id', customerId)
        .single();

      if (subscription) {
        venueId = subscription.venue_id;
      }
    }

    if (!venueId) {
      console.error('❌ Could not find venue for webhook');
      await logSecurityEvent(supabaseAdmin, 'webhook_received', {
        error: 'venue_not_found',
        stripe_event_id: event.id,
        threat_level: threatLevel
      }, req);
      return new Response('Venue not found', { status: 400, headers: corsHeaders });
    }

    // Get the webhook secret for this venue
    const { data: stripeSettings } = await supabaseAdmin
      .from('venue_stripe_settings')
      .select('webhook_secret')
      .eq('venue_id', venueId)
      .single();

    if (!stripeSettings?.webhook_secret) {
      console.error('❌ No webhook secret configured for venue:', venueId);
      await logSecurityEvent(supabaseAdmin, 'webhook_received', {
        error: 'no_webhook_secret',
        venue_id: venueId,
        threat_level: threatLevel
      }, req, venueId);
      return new Response('Webhook secret not configured', { status: 400, headers: corsHeaders });
    }

    venueWebhookSecret = stripeSettings.webhook_secret;

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
      new TextEncoder().encode(venueWebhookSecret),
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
      .from('security_audit')
      .select('id')
      .eq('event_details->stripe_event_id', event.id)
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
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(supabaseAdmin, event, venueId);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(supabaseAdmin, event, venueId);
        break;
      case 'invoice.payment_succeeded':
        await handleSubscriptionPayment(supabaseAdmin, event, venueId);
        break;
      default:
        console.log(`📋 Unhandled event type: ${event.type}`);
    }

    console.log('✅ Webhook processed successfully');
    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('💥 Webhook error:', error);
    return new Response(`Webhook error: ${error.message}`, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
};

async function handlePaymentSuccess(supabase: any, event: StripeEvent, venueId: string) {
  const paymentIntentId = event.data.object.id;
  
  await supabase
    .from('booking_payments')
    .update({ 
      status: 'succeeded', 
      processed_at: new Date().toISOString() 
    })
    .eq('stripe_payment_intent_id', paymentIntentId);

  console.log('💰 Payment succeeded:', paymentIntentId);
}

async function handlePaymentFailure(supabase: any, event: StripeEvent, venueId: string) {
  const paymentIntentId = event.data.object.id;
  
  await supabase
    .from('booking_payments')
    .update({ 
      status: 'failed', 
      failure_reason: event.data.object.last_payment_error?.message || 'Payment failed',
      processed_at: new Date().toISOString() 
    })
    .eq('stripe_payment_intent_id', paymentIntentId);

  console.log('❌ Payment failed:', paymentIntentId);
}

async function handleSubscriptionPayment(supabase: any, event: StripeEvent, venueId: string) {
  const invoice = event.data.object;
  
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
