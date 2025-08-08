
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { action, ...data } = await req.json();
    console.log('WiFi Portal Action:', action, data);

    switch (action) {
      case 'track_connection':
        return await handleTrackConnection(supabase, data);
      case 'create_guest':
        return await handleCreateGuest(supabase, data);
      case 'grant_access':
        return await handleGrantAccess(supabase, data);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('WiFi Portal Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleTrackConnection(supabase: any, data: any) {
  const { venue_id, device_fingerprint, device_info } = data;
  
  // Track the connection analytics
  const analyticsId = await supabase.rpc('track_wifi_connection', {
    p_venue_id: venue_id,
    p_device_fingerprint: device_fingerprint,
    p_device_type: device_info.type,
    p_device_os: device_info.os,
    p_device_browser: device_info.browser,
    p_user_agent: device_info.user_agent,
    p_ip_address: getClientIP(req)
  });

  return new Response(
    JSON.stringify({ success: true, analytics_id: analyticsId }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleCreateGuest(supabase: any, data: any) {
  const { venue_id, device_fingerprint, guest_data, device_info } = data;

  // Create the guest
  const { data: guest, error: guestError } = await supabase
    .from('guests')
    .insert({
      venue_id,
      name: guest_data.name,
      email: guest_data.email,
      phone: guest_data.phone || null,
      opt_in_marketing: guest_data.marketing_consent || false,
      wifi_signup_source: true,
      device_fingerprint,
      wifi_last_connected: new Date().toISOString()
    })
    .select()
    .single();

  if (guestError) {
    throw new Error(`Failed to create guest: ${guestError.message}`);
  }

  console.log('Guest created:', guest);

  // Update device record with guest ID
  await supabase
    .from('wifi_devices')
    .update({ guest_id: guest.id })
    .eq('venue_id', venue_id)
    .eq('device_fingerprint', device_fingerprint);

  // Update analytics with guest ID and signup completion
  await supabase
    .from('wifi_analytics')
    .update({ 
      guest_id: guest.id,
      signup_completed: true
    })
    .eq('venue_id', venue_id)
    .eq('device_fingerprint', device_fingerprint)
    .is('guest_id', null);

  // Assign WiFi Portal tag
  await assignWifiPortalTag(supabase, venue_id, guest.id);

  // Create WiFi session
  const sessionToken = generateSessionToken();
  const { error: sessionError } = await supabase
    .from('wifi_sessions')
    .insert({
      venue_id,
      device_fingerprint,
      guest_id: guest.id,
      session_token: sessionToken,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    });

  if (sessionError) {
    console.error('Session creation error:', sessionError);
  }

  const wifiCredentials = generateWifiCredentials(venue_id);

  return new Response(
    JSON.stringify({ 
      success: true, 
      guest,
      session_token: sessionToken,
      wifi_credentials: wifiCredentials
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGrantAccess(supabase: any, data: any) {
  const { venue_id, device_fingerprint, guest_id, device_info } = data;

  // Update guest's last connection
  await supabase
    .from('guests')
    .update({ wifi_last_connected: new Date().toISOString() })
    .eq('id', guest_id);

  // Create or update WiFi session
  const sessionToken = generateSessionToken();
  const { error: sessionError } = await supabase
    .from('wifi_sessions')
    .upsert({
      venue_id,
      device_fingerprint,
      guest_id,
      session_token: sessionToken,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    });

  if (sessionError) {
    console.error('Session creation error:', sessionError);
  }

  // Update analytics for return visit
  await supabase.rpc('track_wifi_connection', {
    p_venue_id: venue_id,
    p_device_fingerprint: device_fingerprint,
    p_device_type: device_info.type,
    p_device_os: device_info.os,
    p_device_browser: device_info.browser,
    p_user_agent: device_info.user_agent,
    p_guest_id: guest_id
  });

  const wifiCredentials = generateWifiCredentials(venue_id);

  return new Response(
    JSON.stringify({ 
      success: true,
      session_token: sessionToken,
      wifi_credentials: wifiCredentials
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function assignWifiPortalTag(supabase: any, venue_id: string, guest_id: string) {
  try {
    // Get or create "WiFi Portal" tag
    let { data: tag, error: tagError } = await supabase
      .from('tags')
      .select('id')
      .eq('venue_id', venue_id)
      .eq('name', 'WiFi Portal')
      .single();

    if (tagError || !tag) {
      // Create the tag if it doesn't exist
      const { data: newTag, error: createError } = await supabase
        .from('tags')
        .insert({
          venue_id,
          name: 'WiFi Portal',
          color: '#10B981', // Green color
          is_automatic: true
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create WiFi Portal tag:', createError);
        return;
      }
      tag = newTag;
    }

    // Assign tag to guest
    await supabase
      .from('guest_tags')
      .insert({
        guest_id,
        tag_id: tag.id,
        assigned_by: 'system'
      });

  } catch (error) {
    console.error('Error assigning WiFi Portal tag:', error);
  }
}

function generateSessionToken(): string {
  return 'wifi_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateWifiCredentials(venue_id: string) {
  // In a real implementation, this would integrate with your WiFi system
  // For now, return generic credentials
  return {
    network: "Guest_WiFi",
    password: "welcome123"
  };
}

function getClientIP(request: Request): string {
  return request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         '0.0.0.0';
}
