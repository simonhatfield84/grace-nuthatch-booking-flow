import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SquareTokenEncryption } from '../_shared/squareEncryption.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const SQUARE_API_BASE_SANDBOX = 'https://connect.squareupsandbox.com/v2';
const SQUARE_API_BASE_PRODUCTION = 'https://connect.squareup.com/v2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { venue_id, environment } = await req.json();
    
    if (!venue_id || !environment) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get venue settings
    const { data: settings, error: settingsError } = await supabase
      .from('venue_square_settings')
      .select('*')
      .eq('venue_id', venue_id)
      .single();
    
    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ error: 'Square settings not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Decrypt access token
    const encryptedTokenField = environment === 'sandbox'
      ? settings.access_token_sandbox_encrypted
      : settings.access_token_production_encrypted;
    
    if (!encryptedTokenField) {
      return new Response(
        JSON.stringify({ error: 'Access token not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const accessToken = await SquareTokenEncryption.decryptToken(
      JSON.parse(encryptedTokenField),
      venue_id,
      environment
    );
    
    const apiBase = environment === 'sandbox' 
      ? SQUARE_API_BASE_SANDBOX 
      : SQUARE_API_BASE_PRODUCTION;
    
    // Fetch locations
    const locationsResponse = await fetch(`${apiBase}/locations`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Square-Version': '2024-10-17',
        'Content-Type': 'application/json'
      }
    });
    
    if (!locationsResponse.ok) {
      const errorData = await locationsResponse.json();
      console.error('Failed to fetch locations:', errorData);
      throw new Error(`Failed to fetch locations: ${locationsResponse.statusText}`);
    }
    
    const locationsData = await locationsResponse.json();
    const locations = locationsData.locations || [];
    
    // Upsert locations into square_location_map
    for (const location of locations) {
      await supabase
        .from('square_location_map')
        .upsert({
          square_location_id: location.id,
          grace_venue_id: venue_id
        }, {
          onConflict: 'square_location_id'
        });
    }
    
    // Fetch devices for each location
    let totalDevices = 0;
    for (const location of locations) {
      const devicesResponse = await fetch(`${apiBase}/devices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Square-Version': '2024-10-17',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          location_ids: [location.id]
        })
      });
      
      if (devicesResponse.ok) {
        const devicesData = await devicesResponse.json();
        const devices = devicesData.devices || [];
        
        for (const device of devices) {
          await supabase
            .from('square_device_map')
            .upsert({
              square_location_id: location.id,
              square_device_id: device.id,
              square_source_name: device.name || null,
              grace_area_id: null,
              grace_table_id: null
            }, {
              onConflict: 'square_location_id,square_device_id'
            });
          
          totalDevices++;
        }
      }
    }
    
    // Update configuration status
    const currentStatus = settings.configuration_status || {};
    const envStatus = currentStatus[environment] || {};
    const newStatus = {
      ...currentStatus,
      [environment]: {
        ...envStatus,
        locations_synced: true,
        devices_synced: true
      }
    };
    
    await supabase
      .from('venue_square_settings')
      .update({
        configuration_status: newStatus,
        last_sync_at: new Date().toISOString()
      })
      .eq('venue_id', venue_id);
    
    return new Response(
      JSON.stringify({
        success: true,
        locations_synced: locations.length,
        devices_synced: totalDevices
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Square sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
