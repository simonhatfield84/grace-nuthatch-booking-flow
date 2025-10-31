import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const token = Deno.env.get('SQUARE_MERCHANT_ACCESS_TOKEN');
    const version = Deno.env.get('SQUARE_VERSION') || '2024-10-17';
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'SQUARE_MERCHANT_ACCESS_TOKEN not configured' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching Square locations...');
    const response = await fetch('https://connect.squareup.com/v2/locations', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Square-Version': version,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Square API error:', response.status, errorText);
      throw new Error(`Square API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Successfully fetched', data.locations?.length || 0, 'locations');
    
    return new Response(
      JSON.stringify({ locations: data.locations || [] }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching locations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
