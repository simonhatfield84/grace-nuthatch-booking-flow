
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

    const { venue_id, device_fingerprint, guest_data, device_info } = await req.json()

    console.log('WiFi portal signup request:', { venue_id, device_fingerprint, guest_data: { ...guest_data, email: guest_data.email ? '[REDACTED]' : null } })

    // Check for existing guests with the same email or phone to prevent duplicates
    let existingGuest = null
    if (guest_data.email || guest_data.phone) {
      const { data: duplicates } = await supabaseClient.rpc('find_duplicate_guests', {
        guest_email: guest_data.email || null,
        guest_phone: guest_data.phone || null
      })

      if (duplicates && duplicates.length > 0) {
        // Use the first existing guest (most recent)
        existingGuest = duplicates[0]
        console.log('Found existing guest:', existingGuest.id)
      }
    }

    let guestId = null

    if (existingGuest) {
      // Update existing guest with WiFi signup info
      const { data: updatedGuest, error: updateError } = await supabaseClient
        .from('guests')
        .update({
          wifi_signup_source: true,
          device_fingerprint: device_fingerprint,
          wifi_last_connected: new Date().toISOString(),
          // Update marketing opt-in if they chose to opt-in
          opt_in_marketing: guest_data.opt_in_marketing || existingGuest.opt_in_marketing
        })
        .eq('id', existingGuest.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating existing guest:', updateError)
        throw updateError
      }

      guestId = existingGuest.id
      console.log('Updated existing guest for WiFi')
    } else {
      // Create new guest
      const { data: newGuest, error: guestError } = await supabaseClient
        .from('guests')
        .insert([{
          venue_id: venue_id,
          name: guest_data.name,
          email: guest_data.email || null,
          phone: guest_data.phone || null,
          opt_in_marketing: guest_data.opt_in_marketing || false,
          wifi_signup_source: true,
          device_fingerprint: device_fingerprint,
          wifi_last_connected: new Date().toISOString()
        }])
        .select()
        .single()

      if (guestError) {
        console.error('Error creating guest:', guestError)
        throw guestError
      }

      guestId = newGuest.id
      console.log('Created new guest for WiFi:', guestId)

      // Assign automatic tags to the new guest
      await supabaseClient.rpc('assign_automatic_tags', { guest_id_param: guestId })
    }

    // Assign "WiFi Portal" tag if it exists
    const { data: wifiTag } = await supabaseClient
      .from('tags')
      .select('id')
      .eq('venue_id', venue_id)
      .eq('name', 'WiFi Portal')
      .single()

    if (wifiTag) {
      await supabaseClient
        .from('guest_tags')
        .insert([{
          guest_id: guestId,
          tag_id: wifiTag.id,
          assigned_by: 'system'
        }])
        .onConflict('guest_id,tag_id')
        .ignoreDuplicates()
    }

    // Track WiFi device
    await supabaseClient.rpc('track_wifi_connection', {
      p_venue_id: venue_id,
      p_device_fingerprint: device_fingerprint,
      p_device_type: device_info.device_type || null,
      p_device_os: device_info.device_os || null,
      p_device_browser: device_info.device_browser || null,
      p_user_agent: device_info.user_agent || null,
      p_guest_id: guestId
    })

    // Generate session token
    const sessionToken = await supabaseClient.rpc('generate_wifi_session_token')

    // Create WiFi session
    const { error: sessionError } = await supabaseClient
      .from('wifi_sessions')
      .insert([{
        venue_id: venue_id,
        device_fingerprint: device_fingerprint,
        guest_id: guestId,
        session_token: sessionToken,
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        is_active: true
      }])

    if (sessionError) {
      console.error('Error creating WiFi session:', sessionError)
      throw sessionError
    }

    console.log('WiFi portal signup completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        session_token: sessionToken,
        guest_id: guestId,
        existing_guest: !!existingGuest
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )

  } catch (error) {
    console.error('WiFi portal signup error:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred during WiFi signup'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  }
})
