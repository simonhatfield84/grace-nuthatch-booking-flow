import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  venueSlug: string;
}

interface SuccessResponse {
  ok: true;
  publishableKey: string;
  testMode: boolean;
  active: boolean;
}

interface ErrorResponse {
  ok: false;
  code: 'venue_not_found' | 'stripe_inactive' | 'stripe_not_configured' | 'invalid_request';
  message: string;
}

type ApiResponse = SuccessResponse | ErrorResponse;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { venueSlug }: RequestBody = await req.json();

    if (!venueSlug) {
      const errorResponse: ErrorResponse = {
        ok: false,
        code: 'invalid_request',
        message: 'venueSlug is required'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📋 Fetching Stripe settings for venue: ${venueSlug}`);

    // Create service role client (bypasses RLS)
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

    // Step 1: Resolve venue_id from slug
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, approval_status')
      .eq('slug', venueSlug)
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

    // Security: Only serve settings for approved venues
    if (venue.approval_status !== 'approved') {
      console.warn('⚠️ Venue not approved:', venueSlug);
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

    // Step 2: Fetch Stripe settings (only safe columns)
    const { data: settings, error: settingsError } = await supabase
      .from('venue_stripe_settings')
      .select('is_active, test_mode, publishable_key_test, publishable_key_live')
      .eq('venue_id', venue.id)
      .maybeSingle();

    if (settingsError) {
      console.error('❌ Failed to fetch Stripe settings:', settingsError);
      const errorResponse: ErrorResponse = {
        ok: false,
        code: 'stripe_not_configured',
        message: 'Stripe settings not found'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!settings) {
      console.warn('⚠️ No Stripe settings configured for venue:', venueSlug);
      const errorResponse: ErrorResponse = {
        ok: false,
        code: 'stripe_not_configured',
        message: 'Stripe not configured for this venue'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 3: Check if Stripe is active
    if (!settings.is_active) {
      console.warn('⚠️ Stripe inactive for venue:', venueSlug);
      const errorResponse: ErrorResponse = {
        ok: false,
        code: 'stripe_inactive',
        message: 'Stripe payments are currently disabled for this venue'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 4: Choose publishable key based on mode
    const publishableKey = settings.test_mode 
      ? settings.publishable_key_test 
      : settings.publishable_key_live;

    if (!publishableKey) {
      console.error('❌ Missing publishable key for venue:', venueSlug);
      const errorResponse: ErrorResponse = {
        ok: false,
        code: 'stripe_not_configured',
        message: 'Stripe publishable key not configured'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 5: Return success response
    const successResponse: SuccessResponse = {
      ok: true,
      publishableKey,
      testMode: settings.test_mode,
      active: settings.is_active
    };

    // Minimal audit logging (NO KEYS in logs)
    console.log(`✅ Stripe settings retrieved for venue: ${venueSlug}, test_mode: ${settings.test_mode}`);

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300'
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
