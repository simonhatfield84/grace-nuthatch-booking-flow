
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const {
      venue_slug = 'nuthatch',
      full_name,
      email,
      mobile_number,
      date_of_birth,
      marketing_consent = false,
      client_mac,
      ap_mac,
      ssid_name,
      radio_id,
      site,
      origin_url
    } = await req.json();

    console.log('WiFi portal submission received:', {
      venue_slug,
      full_name,
      email,
      mobile_number,
      marketing_consent,
      origin_url
    });

    // Validate required fields
    if (!full_name || !email || !mobile_number) {
      throw new Error('Missing required fields: full_name, email, mobile_number');
    }

    // Get client IP and user agent
    const ip_address = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || null;
    const user_agent = req.headers.get('user-agent') || null;

    // Call the database function to handle the submission
    const { data: result, error } = await supabaseClient.rpc('handle_wifi_portal_submission', {
      p_venue_slug: venue_slug,
      p_full_name: full_name,
      p_email: email,
      p_mobile_number: mobile_number,
      p_date_of_birth: date_of_birth || null,
      p_marketing_consent: marketing_consent,
      p_client_mac: client_mac || null,
      p_ap_mac: ap_mac || null,
      p_ssid_name: ssid_name || null,
      p_radio_id: radio_id || null,
      p_site: site || null,
      p_origin_url: origin_url || null,
      p_ip_address: ip_address,
      p_user_agent: user_agent
    });

    if (error) {
      console.error('Database function error:', error);
      throw error;
    }

    console.log('WiFi portal submission successful:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('WiFi portal submission error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: error.message === 'Method not allowed' ? 405 : 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
})
