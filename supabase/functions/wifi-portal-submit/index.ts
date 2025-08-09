
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { venueSlug, formData, omadaParams, userAgent, ipAddress } = await req.json()

    console.log('WiFi portal submission:', { venueSlug, formData, omadaParams })

    // Call the database function
    const { data, error } = await supabase.rpc('handle_wifi_portal_submission', {
      p_venue_slug: venueSlug,
      p_full_name: formData.fullName,
      p_email: formData.email,
      p_mobile_number: formData.mobileNumber,
      p_date_of_birth: formData.dateOfBirth || null,
      p_marketing_consent: formData.marketingConsent || false,
      p_client_mac: omadaParams.clientMac || null,
      p_ap_mac: omadaParams.apMac || null,
      p_ssid_name: omadaParams.ssidName || null,
      p_radio_id: omadaParams.radioId || null,
      p_site: omadaParams.site || null,
      p_origin_url: omadaParams.originUrl || null,
      p_ip_address: ipAddress || null,
      p_user_agent: userAgent || null
    })

    if (error) {
      console.error('Database function error:', error)
      return new Response(
        JSON.stringify({ success: false, error: 'Database error' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    console.log('Portal submission result:', data)

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('WiFi portal submission error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
