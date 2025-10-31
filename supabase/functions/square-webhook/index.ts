import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createErrorResponse } from '../_shared/errorSanitizer.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SQUARE_WEBHOOK_SECRET = Deno.env.get('SQUARE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    // Get raw body for HMAC verification
    const rawBody = await req.text();
    
    // Extract Square signature from headers
    const signature = req.headers.get('x-square-hmacsha256-signature') || 
                     req.headers.get('x-square-signature');
    
    let signatureValid = false;
    
    // Verify HMAC signature if secret is configured
    if (SQUARE_WEBHOOK_SECRET && signature) {
      const notificationUrl = req.headers.get('x-square-notification-url') || '';
      const payload = notificationUrl + rawBody;
      
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(SQUARE_WEBHOOK_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(payload)
      );
      
      const computedSignature = btoa(
        String.fromCharCode(...new Uint8Array(signatureBuffer))
      );
      
      signatureValid = computedSignature === signature;
    } else {
      console.warn('SQUARE_WEBHOOK_SECRET not configured or signature missing');
    }

    // Parse event payload
    const event = JSON.parse(rawBody);
    const eventId = event.event_id || crypto.randomUUID();
    const eventType = event.type || 'unknown';
    const locationId = event.location_id || null;
    const resourceId = event.data?.id || null;

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Persist event to square_webhook_events (idempotent)
    const { data: webhookEvent, error: insertError } = await supabase
      .from('square_webhook_events')
      .insert({
        event_id: eventId,
        event_type: eventType,
        location_id: locationId,
        resource_id: resourceId,
        signature_valid: signatureValid,
        payload: event,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      // Check if it's a duplicate event_id (idempotency)
      if (insertError.code === '23505') {
        console.log(`Duplicate event ${eventId}, returning 200`);
        return new Response(
          JSON.stringify({ ok: true, message: 'Event already processed' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.error('Failed to insert webhook event:', insertError);
      return new Response(
        JSON.stringify({ ok: true, message: 'Event received' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enqueue for processing
    const { error: queueError } = await supabase
      .from('square_event_queue')
      .insert({
        webhook_event_id: webhookEvent.id,
        attempts: 0,
        next_attempt_at: new Date().toISOString()
      });

    if (queueError) {
      console.error('Failed to enqueue event:', queueError);
    }

    // Always return 200 to Square
    return new Response(
      JSON.stringify({ 
        ok: true, 
        event_id: eventId,
        signature_valid: signatureValid 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Square webhook error:', error);
    return createErrorResponse(error, 200); // Still return 200 to Square
  }
});
