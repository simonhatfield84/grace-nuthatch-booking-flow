
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  bookingId: number;
  guestEmail: string;
  venueId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, guestEmail, venueId }: EmailRequest = await req.json();

    console.log(`📧 Sending confirmation email for booking ${bookingId} to ${guestEmail}`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Use the existing send-email function
    const { data, error } = await supabaseAdmin.functions.invoke('send-email', {
      body: {
        booking_id: bookingId,
        guest_email: guestEmail,
        venue_id: venueId,
        email_type: 'booking_confirmation'
      }
    });

    if (error) {
      console.error('❌ Email sending failed:', error);
      throw error;
    }

    console.log('✅ Confirmation email sent successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Confirmation email sent successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Send confirmation email error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);
