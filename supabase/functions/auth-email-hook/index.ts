
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailHookRequest {
  type: 'recovery' | 'confirmation' | 'magic_link';
  user: {
    id: string;
    email: string;
    user_metadata?: Record<string, any>;
  };
  redirect_to?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, user, redirect_to }: AuthEmailHookRequest = await req.json();

    // Only intercept password recovery emails
    if (type === 'recovery') {
      // Call our branded email function
      const brandedEmailResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-branded-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          to: user.email,
          subject: 'Reset Your Grace OS Password',
          template_key: 'password_reset',
          template_data: {
            name: user.user_metadata?.first_name || user.email.split('@')[0],
            reset_link: redirect_to || 'https://grace-os.co.uk/auth',
          },
        }),
      });

      const result = await brandedEmailResponse.json();
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // For other email types, return success (let Supabase handle them)
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in auth-email-hook function:", error);
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
