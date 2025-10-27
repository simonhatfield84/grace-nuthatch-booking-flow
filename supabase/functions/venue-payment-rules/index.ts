import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  venueSlug: string;
  serviceId?: string;
  partySize: number;
}

interface SuccessResponse {
  ok: true;
  stripeActive: boolean;
  shouldCharge: boolean;
  amount: number;
  description: string;
  chargeType: string;
}

interface ErrorResponse {
  ok: false;
  code: 'venue_not_found' | 'service_not_found' | 'invalid_request';
  message: string;
}

type ApiResponse = SuccessResponse | ErrorResponse;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { venueSlug, serviceId, partySize }: RequestBody = await req.json();

    if (!venueSlug || !partySize) {
      const errorResponse: ErrorResponse = {
        ok: false,
        code: 'invalid_request',
        message: 'venueSlug and partySize are required'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ✅ GUARDRAIL 1: Rate limiting (30 requests per IP per venue per 5 minutes)
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `payment-calc:${venueSlug}:${clientIp}`;
    
    const { rateLimit } = await import('../_shared/rateLimit.ts');
    const allowed = await rateLimit(rateLimitKey, 30, 300); // 30 requests, 5 min window
    
    if (!allowed) {
      const errorResponse: ErrorResponse = {
        ok: false,
        code: 'invalid_request',
        message: 'Too many payment calculation requests. Please try again later.'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`💰 Calculating payment for venue: ${venueSlug}, service: ${serviceId}, party: ${partySize}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Resolve venue
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id')
      .eq('slug', venueSlug)
      .eq('approval_status', 'approved')
      .single();

    if (venueError || !venue) {
      console.error('❌ Venue not found:', venueSlug);
      const errorResponse: ErrorResponse = {
        ok: false,
        code: 'venue_not_found',
        message: 'Venue not found'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get venue Stripe settings
    const { data: venueSettings } = await supabase
      .from('venue_stripe_settings')
      .select('is_active, charge_type, charge_amount_per_guest, minimum_guests_for_charge')
      .eq('venue_id', venue.id)
      .maybeSingle();

    const stripeActive = venueSettings?.is_active === true;
    
    let shouldCharge = false;
    let amount = 0;
    let description = 'No payment required';
    let chargeType = 'none';

    // If service specified, get service payment settings
    if (serviceId) {
      const { data: serviceSettings, error: serviceError } = await supabase
        .from('services')
        .select('requires_payment, charge_type, minimum_guests_for_charge, charge_amount_per_guest, title')
        .eq('id', serviceId)
        .single();

      if (serviceError) {
        console.error('❌ Service not found:', serviceId);
        const errorResponse: ErrorResponse = {
          ok: false,
          code: 'service_not_found',
          message: 'Service not found'
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Service requires payment - use service settings
      if (serviceSettings?.requires_payment) {
        const serviceChargeType = serviceSettings.charge_type || 'all_reservations';
        const serviceChargeAmount = serviceSettings.charge_amount_per_guest || 0;
        const serviceMinGuests = serviceSettings.minimum_guests_for_charge || 1;

        switch (serviceChargeType) {
          case 'all_reservations':
            shouldCharge = true;
            amount = serviceChargeAmount * partySize;
            description = `${serviceSettings.title} booking fee for ${partySize} guests`;
            chargeType = serviceChargeType;
            break;
            
          case 'large_groups':
            if (partySize >= serviceMinGuests) {
              shouldCharge = true;
              amount = serviceChargeAmount * partySize;
              description = `${serviceSettings.title} large group fee for ${partySize} guests`;
              chargeType = serviceChargeType;
            }
            break;
            
          default:
            shouldCharge = true;
            amount = serviceChargeAmount * partySize;
            description = `${serviceSettings.title} booking fee for ${partySize} guests`;
            chargeType = serviceChargeType;
        }
      } else if (stripeActive && venueSettings) {
        // Service doesn't require payment, fall back to venue settings
        switch (venueSettings.charge_type) {
          case 'all_reservations':
            shouldCharge = true;
            amount = (venueSettings.charge_amount_per_guest || 0) * partySize;
            description = `Booking fee for ${partySize} guests`;
            chargeType = venueSettings.charge_type;
            break;
            
          case 'large_groups':
            const minGuests = venueSettings.minimum_guests_for_charge || 8;
            if (partySize >= minGuests) {
              shouldCharge = true;
              amount = (venueSettings.charge_amount_per_guest || 0) * partySize;
              description = `Large group fee for ${partySize} guests`;
              chargeType = venueSettings.charge_type;
            }
            break;
        }
      }
    } else if (stripeActive && venueSettings) {
      // No service specified, use venue settings
      switch (venueSettings.charge_type) {
        case 'all_reservations':
          shouldCharge = true;
          amount = (venueSettings.charge_amount_per_guest || 0) * partySize;
          description = `Booking fee for ${partySize} guests`;
          chargeType = venueSettings.charge_type;
          break;
          
        case 'large_groups':
          const minGuests = venueSettings.minimum_guests_for_charge || 8;
          if (partySize >= minGuests) {
            shouldCharge = true;
            amount = (venueSettings.charge_amount_per_guest || 0) * partySize;
            description = `Large group fee for ${partySize} guests`;
            chargeType = venueSettings.charge_type;
          }
          break;
      }
    }

    // ✅ GUARDRAIL 1: Return only safe fields (no secret Stripe keys)
    const successResponse: SuccessResponse = {
      ok: true,
      stripeActive,
      shouldCharge,
      amount,
      description,
      chargeType
    };

    console.log('✅ Payment calculation result:', successResponse);

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=60'
      }
    });

  } catch (error: any) {
    console.error('💥 Unexpected error:', error);
    const errorResponse: ErrorResponse = {
      ok: false,
      code: 'invalid_request',
      message: 'Internal server error'
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);
