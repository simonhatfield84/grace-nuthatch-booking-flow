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
  venue: {
    id: string;
    name: string;
    slug: string;
    approval_status: string;
  };
}

interface ErrorResponse {
  ok: false;
  code: 'venue_not_found' | 'venue_not_approved' | 'invalid_request';
  message: string;
}

type ApiResponse = SuccessResponse | ErrorResponse;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    console.log(`📋 Looking up venue: ${venueSlug}`);

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

    // Lookup venue by slug
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, name, slug, approval_status')
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

    // Check approval status
    if (venue.approval_status !== 'approved') {
      console.warn('⚠️ Venue not approved:', venueSlug, venue.approval_status);
      const errorResponse: ErrorResponse = {
        ok: false,
        code: 'venue_not_approved',
        message: 'This venue is not currently accepting bookings'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Return success
    const successResponse: SuccessResponse = {
      ok: true,
      venue: {
        id: venue.id,
        name: venue.name,
        slug: venue.slug,
        approval_status: venue.approval_status
      }
    };

    console.log(`✅ Venue lookup successful:`, venue.slug);

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
