
import { supabase } from "@/integrations/supabase/client";

export interface EmailTemplateVariables {
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

// Export the type alias for backward compatibility
export type TemplateVariables = EmailTemplateVariables;

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

  static getAvailableVariables(): Record<string, string> {
    return {
      guest_name: "Guest's full name",
      venue_name: "Name of the venue",
      booking_reference: "Unique booking reference number",
      booking_date: "Date of the booking",
      booking_time: "Time of the booking",
      party_size: "Number of guests",
      service: "Service type (e.g., Dinner, Afternoon Tea)",
      payment_amount: "Payment amount required",
      payment_link: "Link to complete payment",
      custom_message: "Custom message from venue staff",
      modify_link: "Link to modify the booking",
      cancel_link: "Link to cancel the booking",
      email_signature: "Venue's email signature"
    };
  }

  static previewTemplate(content: string, variables?: Partial<EmailTemplateVariables>): string {
    const defaultVariables: EmailTemplateVariables = {
      guest_name: "John Smith",
      venue_name: "The Nuthatch",
      booking_reference: "BK-2024-123456",
      booking_date: "Friday, 15th March 2024",
      booking_time: "7:30 PM",
      party_size: "4 guests",
      service: "Dinner",
      payment_amount: "£50.00",
      payment_link: "#payment-link",
      custom_message: "Looking forward to your visit!",
      modify_link: "#modify-booking",
      cancel_link: "#cancel-booking",
      email_signature: "Best regards,\nThe Nuthatch Team"
    };

    const mergedVariables = { ...defaultVariables, ...variables };
    let preview = content;

    Object.entries(mergedVariables).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        preview = preview.replace(placeholder, value.toString());
      }
    });

    // Handle conditional sections
    preview = preview.replace(/{{#(\w+)}}(.*?){{\/\1}}/gs, (match, condition, content) => {
      return mergedVariables[condition as keyof EmailTemplateVariables] ? content : '';
    });

    return preview;
  }
}

// Create a singleton instance for backward compatibility
export const emailTemplateService = new EmailTemplateService();
