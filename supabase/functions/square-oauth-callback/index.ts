import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SquareTokenEncryption } from '../_shared/squareEncryption.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const SQUARE_TOKEN_URL_SANDBOX = 'https://connect.squareupsandbox.com/oauth2/token';
const SQUARE_TOKEN_URL_PRODUCTION = 'https://connect.squareup.com/oauth2/token';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const errorParam = url.searchParams.get('error');
    
    if (errorParam) {
      console.error('Square OAuth error:', errorParam);
      const redirectUrl = `${url.origin}/settings?tab=square&error=oauth_denied`;
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': redirectUrl }
      });
    }
    
    if (!code || !state) {
      const redirectUrl = `${url.origin}/settings?tab=square&error=missing_params`;
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': redirectUrl }
      });
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify state token
    const { data: oauthState, error: stateError } = await supabase
      .from('square_oauth_states')
      .select('*')
      .eq('state_token', state)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    
    if (stateError || !oauthState) {
      console.error('Invalid OAuth state:', stateError);
      const redirectUrl = `${url.origin}/settings?tab=square&error=invalid_state`;
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': redirectUrl }
      });
    }
    
    // Mark state as used
    await supabase
      .from('square_oauth_states')
      .update({ used_at: new Date().toISOString() })
      .eq('id', oauthState.id);
    
    // Get application ID from venue settings
    const { data: settings } = await supabase
      .from('venue_square_settings')
      .select('*')
      .eq('venue_id', oauthState.venue_id)
      .maybeSingle();
    
    const applicationId = oauthState.environment === 'sandbox'
      ? settings?.application_id_sandbox
      : settings?.application_id_production;
    
    if (!applicationId) {
      const redirectUrl = `${url.origin}/settings?tab=square&error=no_app_id`;
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': redirectUrl }
      });
    }
    
    // Get client secret from environment
    const clientSecret = Deno.env.get(`SQUARE_CLIENT_SECRET_${oauthState.environment.toUpperCase()}`);
    if (!clientSecret) {
      console.error('Client secret not configured');
      const redirectUrl = `${url.origin}/settings?tab=square&error=config_error`;
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': redirectUrl }
      });
    }
    
    // Exchange authorization code for access token
    const tokenUrl = oauthState.environment === 'sandbox'
      ? SQUARE_TOKEN_URL_SANDBOX
      : SQUARE_TOKEN_URL_PRODUCTION;
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Square-Version': '2024-10-17'
      },
      body: JSON.stringify({
        client_id: applicationId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code'
      })
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      const redirectUrl = `${url.origin}/settings?tab=square&error=token_failed`;
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': redirectUrl }
      });
    }
    
    const tokenData = await tokenResponse.json();
    
    // Encrypt tokens
    const encryptedAccessToken = await SquareTokenEncryption.encryptToken(
      tokenData.access_token,
      oauthState.venue_id,
      oauthState.environment
    );
    
    const encryptedRefreshToken = tokenData.refresh_token
      ? await SquareTokenEncryption.encryptToken(
          tokenData.refresh_token,
          oauthState.venue_id,
          oauthState.environment
        )
      : null;
    
    // Calculate token expiry
    const expiresAt = tokenData.expires_at
      ? new Date(tokenData.expires_at)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default
    
    // Update venue settings with tokens
    const updateFields: any = {
      venue_id: oauthState.venue_id,
      updated_at: new Date().toISOString()
    };
    
    if (oauthState.environment === 'sandbox') {
      updateFields.access_token_sandbox_encrypted = JSON.stringify(encryptedAccessToken);
      updateFields.refresh_token_sandbox_encrypted = encryptedRefreshToken ? JSON.stringify(encryptedRefreshToken) : null;
      updateFields.token_expires_at_sandbox = expiresAt.toISOString();
      updateFields.merchant_id_sandbox = tokenData.merchant_id;
    } else {
      updateFields.access_token_production_encrypted = JSON.stringify(encryptedAccessToken);
      updateFields.refresh_token_production_encrypted = encryptedRefreshToken ? JSON.stringify(encryptedRefreshToken) : null;
      updateFields.token_expires_at_production = expiresAt.toISOString();
      updateFields.merchant_id_production = tokenData.merchant_id;
    }
    
    // Upsert settings
    const { error: updateError } = await supabase
      .from('venue_square_settings')
      .upsert(updateFields);
    
    if (updateError) {
      console.error('Failed to save tokens:', updateError);
      const redirectUrl = `${url.origin}/settings?tab=square&error=save_failed`;
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': redirectUrl }
      });
    }
    
    // Update configuration status
    const currentStatus = settings?.configuration_status || {};
    const envStatus = currentStatus[oauthState.environment] || {};
    const newStatus = {
      ...currentStatus,
      [oauthState.environment]: {
        ...envStatus,
        oauth_connected: true
      }
    };
    
    await supabase
      .from('venue_square_settings')
      .update({ configuration_status: newStatus })
      .eq('venue_id', oauthState.venue_id);
    
    // Trigger auto-sync of locations and devices
    await supabase.functions.invoke('square-sync-mappings', {
      body: {
        venue_id: oauthState.venue_id,
        environment: oauthState.environment
      }
    });
    
    // Redirect to settings page
    const redirectUrl = `${url.origin}/settings?tab=square&success=true`;
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl
      }
    });
    
  } catch (error) {
    console.error('Square OAuth callback error:', error);
    const url = new URL(req.url);
    const redirectUrl = `${url.origin}/settings?tab=square&error=callback_failed`;
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl
      }
    });
  }
});
