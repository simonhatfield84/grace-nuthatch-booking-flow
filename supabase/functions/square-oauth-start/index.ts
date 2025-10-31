import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const SQUARE_AUTH_URL_SANDBOX = 'https://connect.squareupsandbox.com/oauth2/authorize';
const SQUARE_AUTH_URL_PRODUCTION = 'https://connect.squareup.com/oauth2/authorize';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { venue_id, environment, application_id } = await req.json();
    
    if (!venue_id || !environment || !application_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Generate secure state token
    const stateToken = crypto.randomUUID();
    const redirectUri = `${SUPABASE_URL}/functions/v1/square-oauth-callback`;
    
    // Store state in database
    const { error: stateError } = await supabase
      .from('square_oauth_states')
      .insert({
        venue_id,
        state_token: stateToken,
        environment,
        redirect_uri: redirectUri
      });
    
    if (stateError) {
      console.error('Failed to create OAuth state:', stateError);
      throw new Error('Failed to initialize OAuth flow');
    }
    
    // Build authorization URL
    const authUrl = environment === 'sandbox' 
      ? SQUARE_AUTH_URL_SANDBOX 
      : SQUARE_AUTH_URL_PRODUCTION;
    
    const scopes = [
      'MERCHANT_PROFILE_READ',
      'PAYMENTS_READ',
      'ORDERS_READ',
      'CUSTOMERS_READ',
      'ITEMS_READ',
      'INVENTORY_READ'
    ];
    
    const authParams = new URLSearchParams({
      client_id: application_id,
      scope: scopes.join(' '),
      session: 'false',
      state: stateToken
    });
    
    const authorizeUrl = `${authUrl}?${authParams.toString()}`;
    
    return new Response(
      JSON.stringify({ 
        success: true,
        authorize_url: authorizeUrl,
        state: stateToken
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Square OAuth start error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
