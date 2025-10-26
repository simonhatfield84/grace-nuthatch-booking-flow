
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const authEmailHookSchema = z.object({
  type: z.enum(['recovery', 'confirmation', 'magic_link']),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    user_metadata: z.record(z.any()).optional(),
  }),
  redirect_to: z.string().url().optional(),
});

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
    const requestData = await req.json();
    
    // Validate input with Zod
    const validationResult = authEmailHookSchema.safeParse(requestData);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid auth hook parameters',
          details: validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    const { type, user, redirect_to }: AuthEmailHookRequest = validationResult.data;

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
