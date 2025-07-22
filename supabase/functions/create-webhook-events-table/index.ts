
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create the webhook_events table if it doesn't exist
    const { error } = await supabaseClient.rpc('execute_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.webhook_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          stripe_event_id TEXT UNIQUE NOT NULL,
          event_type TEXT NOT NULL,
          test_mode BOOLEAN DEFAULT false,
          processed_at TIMESTAMPTZ DEFAULT NOW(),
          event_data JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Enable RLS but allow service role to access
        ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for service role access
        CREATE POLICY IF NOT EXISTS "service_role_access" ON public.webhook_events
          FOR ALL USING (true);
      `
    })

    if (error) {
      console.error('Error creating webhook_events table:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to create table', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ message: 'webhook_events table created successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
