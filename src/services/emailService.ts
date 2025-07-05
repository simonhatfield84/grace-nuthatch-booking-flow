import { supabase } from "@/integrations/supabase/client";

export interface EmailTemplate {
  template_key: string;
  subject: string;
  html_content: string;
  text_content?: string;
  template_type: 'platform' | 'venue';
}

export interface EmailData {
  to: string[];
  template_key: string;
  variables: Record<string, string>;
  venue_id?: string;
}

export class EmailService {
  private static instance: EmailService;
  
  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async getEmailConfiguration(venue_id?: string) {
    // Get venue-specific email settings if venue_id provided
    if (venue_id) {
      const { data: venueSettings } = await supabase
        .from('venue_settings')
        .select('setting_key, setting_value')
        .eq('venue_id', venue_id)
        .in('setting_key', ['email_domain', 'email_from_name', 'custom_email_domain']);
      
      const settings: Record<string, any> = {};
      if (venueSettings) {
        venueSettings.forEach(setting => {
          if (setting.setting_key && setting.setting_value) {
            settings[setting.setting_key] = setting.setting_value;
          }
        });
      }

      return {
        domain: settings.custom_email_domain || settings.email_domain || 'grace-os.com',
        fromName: settings.email_from_name || 'Grace',
        isCustomDomain: !!settings.custom_email_domain
      };
    }

    // Default platform configuration
    return {
      domain: 'grace-os.com',
      fromName: 'Grace OS',
      isCustomDomain: false
    };
  }

  async getEmailTemplate(template_key: string): Promise<EmailTemplate | null> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('template_key, subject, html_content, text_content, template_type')
      .eq('template_key', template_key)
      .single();

    if (error || !data) {
      console.error('Failed to get email template:', error);
      return null;
    }

    const templateType = data.template_type;
    if (templateType !== 'platform' && templateType !== 'venue') {
      console.error('Invalid template_type:', templateType);
      return null;
    }

    return {
      template_key: data.template_key,
      subject: data.subject,
      html_content: data.html_content,
      text_content: data.text_content || undefined,
      template_type: templateType as 'platform' | 'venue'
    };
  }

  private interpolateTemplate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const template = await this.getEmailTemplate(emailData.template_key);
      if (!template) {
        throw new Error(`Template ${emailData.template_key} not found`);
      }

      const emailConfig = await this.getEmailConfiguration(emailData.venue_id);
      
      // Determine the from address based on template type
      let fromAddress: string;
      if (template.template_type === 'platform') {
        fromAddress = `${emailConfig.fromName} <noreply@grace-os.com>`;
      } else {
        // For venue templates, use custom domain or fallback to grace-os.com subdomain
        if (emailConfig.isCustomDomain) {
          fromAddress = `${emailConfig.fromName} <noreply@${emailConfig.domain}>`;
        } else {
          // Get venue name for fallback
          const venueName = emailData.variables.venue_name?.toLowerCase().replace(/\s+/g, '') || 'venue';
          fromAddress = `${emailConfig.fromName} <${venueName}@grace-os.com>`;
        }
      }

      // Interpolate template with variables
      const subject = this.interpolateTemplate(template.subject, emailData.variables);
      const htmlContent = this.interpolateTemplate(template.html_content, emailData.variables);
      const textContent = template.text_content 
        ? this.interpolateTemplate(template.text_content, emailData.variables) 
        : undefined;

      // Call the send-email edge function
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailData.to,
          from: fromAddress,
          subject,
          html: htmlContent,
          text: textContent
        }
      });

      if (error) {
        console.error('Failed to send email:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }

  // Convenience methods for common email types
  async sendBookingConfirmation(
    guestEmail: string, 
    bookingData: Record<string, string>, 
    venue_id: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: [guestEmail],
      template_key: 'booking_confirmation',
      variables: bookingData,
      venue_id
    });
  }

  async sendBookingReminder(
    guestEmail: string, 
    bookingData: Record<string, string>, 
    venue_id: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: [guestEmail],
      template_key: 'booking_reminder',
      variables: bookingData,
      venue_id
    });
  }

  async sendUserInvitation(
    userEmail: string, 
    invitationData: Record<string, string>
  ): Promise<boolean> {
    return this.sendEmail({
      to: [userEmail],
      template_key: 'user_invitation',
      variables: invitationData
    });
  }
}

export const emailService = EmailService.getInstance();
