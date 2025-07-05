
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendCodeRequest {
  email: string;
  code: string;
  firstName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, firstName }: SendCodeRequest = await req.json();

    // Create Supabase client
    const supabaseUrl = "https://wxyotttvyexxzeaewyga.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Send verification code email
    const { error: emailError } = await supabase.functions.invoke('send-email', {
      body: {
        to: [email],
        from: 'Grace Setup <noreply@grace-hospitality.com>',
        subject: 'Your Grace Setup Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; padding: 20px;">
              <h1 style="color: #3B82F6; font-size: 2.5rem; margin-bottom: 10px;">grace</h1>
              <p style="color: #6B7280; margin-bottom: 30px;">Hospitality Venue Management System</p>
            </div>
            
            <div style="background: #F9FAFB; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1F2937; margin-bottom: 20px;">
                ${firstName ? `Hi ${firstName},` : 'Hello,'}
              </h2>
              
              <p style="color: #374151; margin-bottom: 20px;">
                Thanks for setting up your Grace account! Please use the verification code below to complete your setup.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background: white; padding: 20px 40px; border-radius: 8px; border: 2px solid #E5E7EB;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1F2937;">
                    ${code}
                  </span>
                </div>
              </div>
              
              <p style="color: #6B7280; font-size: 14px; text-align: center;">
                This code expires in 10 minutes. If you didn't request this, please ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px;">
              <p style="color: #9CA3AF; font-size: 12px;">
                © 2024 Grace Hospitality Management System
              </p>
            </div>
          </div>
        `,
        text: `
Hi${firstName ? ` ${firstName}` : ''},

Thanks for setting up your Grace account! Please use this verification code to complete your setup:

${code}

This code expires in 10 minutes. If you didn't request this, please ignore this email.

© 2024 Grace Hospitality Management System
        `
      }
    });

    if (emailError) {
      throw emailError;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-verification-code function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
