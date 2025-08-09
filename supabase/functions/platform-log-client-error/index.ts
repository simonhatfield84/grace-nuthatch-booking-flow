
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

interface ClientError {
  message: string;
  stack?: string;
  url?: string;
  line?: number;
  column?: number;
  userAgent?: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const errorData: ClientError = await req.json();
    
    console.log('Logging client error:', errorData.message);
    
    const { error } = await supabase
      .from('platform_logs')
      .insert({
        type: 'client_error',
        content_text: `Client Error: ${errorData.message}`,
        severity: 'error',
        error_details: {
          message: errorData.message,
          stack: errorData.stack,
          url: errorData.url,
          line: errorData.line,
          column: errorData.column,
          userAgent: errorData.userAgent,
          userId: errorData.userId,
          sessionId: errorData.sessionId
        },
        metadata: {
          source: 'client',
          timestamp: errorData.timestamp
        }
      });

    if (error) {
      console.error('Failed to log client error:', error);
      throw error;
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Error logged successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in platform-log-client-error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
