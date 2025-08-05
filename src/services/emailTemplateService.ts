
import { supabase } from "@/integrations/supabase/client";

interface EmailTemplateVariables {
  guest_name: string;
  venue_name: string;
  booking_reference: string;
  booking_date: string;
  booking_time: string;
  party_size: string;
  service?: string;
  payment_amount?: string;
  payment_link?: string;
  custom_message?: string;
  modify_link?: string;
  cancel_link?: string;
  email_signature?: string;
}

export class EmailTemplateService {
  static async getTemplate(venueId: string, templateKey: string) {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('venue_id', venueId)
      .eq('template_key', templateKey)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  static async renderTemplate(
    template: any,
    variables: EmailTemplateVariables
  ): Promise<{ subject: string; html: string }> {
    let subject = template.subject || '';
    let html = template.html_content || '';

    // Replace all template variables
    Object.entries(variables).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(placeholder, value.toString());
        html = html.replace(placeholder, value.toString());
      }
    });

    // Handle conditional sections (Handlebars-like syntax)
    html = html.replace(/{{#(\w+)}}(.*?){{\/\1}}/gs, (match, condition, content) => {
      return variables[condition as keyof EmailTemplateVariables] ? content : '';
    });

    return { subject, html };
  }

  static async sendTemplatedEmail(
    venueId: string,
    templateKey: string,
    recipientEmail: string,
    variables: EmailTemplateVariables
  ) {
    try {
      const template = await this.getTemplate(venueId, templateKey);
      const { subject, html } = await this.renderTemplate(template, variables);

      const { error } = await supabase.functions.invoke('send-branded-email', {
        body: {
          to: recipientEmail,
          subject,
          html,
          venue_id: venueId
        }
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error(`Failed to send ${templateKey} email:`, error);
      throw error;
    }
  }
}
