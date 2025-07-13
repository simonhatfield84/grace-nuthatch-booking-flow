
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  to: string | string[];
  from?: string;
  from_name?: string;
  from_email?: string;
  subject: string;
  html: string;
  text?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      to, 
      from, 
      from_name, 
      from_email, 
      subject, 
      html, 
      text 
    }: SendEmailRequest = await req.json();

    // Determine the from address
    let fromAddress: string;
    if (from) {
      fromAddress = from;
    } else if (from_name && from_email) {
      fromAddress = `${from_name} <${from_email}>`;
    } else {
      fromAddress = from_email || 'noreply@grace-os.co.uk';
    }

    console.log(`Sending email from: ${fromAddress} to: ${Array.isArray(to) ? to.join(', ') : to}`);

    const emailResponse = await resend.emails.send({
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
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
