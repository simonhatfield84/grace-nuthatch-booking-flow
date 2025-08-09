
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface ServerError {
  message: string;
  stack?: string;
  function?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  timestamp: string;
  metadata?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const errorData: ServerError = await req.json();
    
    console.log('Logging server error:', errorData.message);
    
    const { error } = await supabase
      .from('platform_logs')
      .insert({
        type: 'server_error',
        content_text: `Server Error: ${errorData.message}`,
        severity: 'error',
        error_details: {
          message: errorData.message,
          stack: errorData.stack,
          function: errorData.function,
          endpoint: errorData.endpoint,
          method: errorData.method,
          statusCode: errorData.statusCode,
          metadata: errorData.metadata
        },
        metadata: {
          source: 'server',
          timestamp: errorData.timestamp
        }
      });

    if (error) {
      console.error('Failed to log server error:', error);
      throw error;
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Server error logged successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in platform-log-server-error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
