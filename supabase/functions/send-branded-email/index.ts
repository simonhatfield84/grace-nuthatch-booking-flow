
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BrandedEmailRequest {
  to: string;
  subject: string;
  template_key: string;
  template_data: Record<string, string>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { to, subject, template_key, template_data }: BrandedEmailRequest = await req.json();

    // Get email template
    const { data: template, error: templateError } = await supabaseClient
      .from('email_templates')
      .select('*')
      .eq('template_key', template_key)
      .single();

    if (templateError || !template) {
      throw new Error(`Template not found: ${template_key}`);
    }

    // Get platform settings for branding
    const { data: settings, error: settingsError } = await supabaseClient
      .from('platform_settings')
      .select('setting_key, setting_value')
      .in('setting_key', [
        'from_email', 'from_name', 'email_logo_url', 
        'email_primary_color', 'email_secondary_color'
      ]);

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
    }

    // Parse settings
    const platformSettings: Record<string, string> = {};
    settings?.forEach(setting => {
      try {
        platformSettings[setting.setting_key] = JSON.parse(setting.setting_value);
      } catch {
        platformSettings[setting.setting_key] = setting.setting_value;
      }
    });

    // Replace template variables
    let htmlContent = template.html_content;
    let textContent = template.text_content || '';

    Object.entries(template_data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value);
      textContent = textContent.replace(new RegExp(placeholder, 'g'), value);
    });

    // Apply branding colors if they exist
    if (platformSettings.email_primary_color) {
      htmlContent = htmlContent.replace(/#ea580c/g, platformSettings.email_primary_color);
    }
    if (platformSettings.email_secondary_color) {
      htmlContent = htmlContent.replace(/#1e293b/g, platformSettings.email_secondary_color);
    }

    // Use the send-email function
    const emailResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
      },
      body: JSON.stringify({
        to,
        subject: template.subject,
        html: htmlContent,
        text: textContent,
        from_email: platformSettings.from_email || 'noreply@grace-os.co.uk',
        from_name: platformSettings.from_name || 'Fred at Grace OS',
      }),
    });

    const result = await emailResponse.json();

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-branded-email function:", error);
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
