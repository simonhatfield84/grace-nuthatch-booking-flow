import { emailService } from "./emailService";
import { emailTemplateService } from "./emailTemplateService";
import { supabase } from "@/integrations/supabase/client";

/**
 * Enhanced booking email service that handles all booking-related emails
 * with proper template support and automatic token generation
 */
export const bookingEmailService = {
  /**
   * Send booking confirmation email
   */
  async sendConfirmation(
    bookingId: number,
    guestEmail: string,
    bookingData: {
      guest_name: string;
      venue_name: string;
      booking_date: string;
      booking_time: string;
      party_size: string;
      booking_reference: string;
    },
    venueSlug: string
  ): Promise<boolean> {
    return emailService.sendBookingConfirmation(
      guestEmail,
      { ...bookingData, booking_id: bookingId },
      venueSlug
    );
  },

  /**
   * Send booking cancellation email
   */
  async sendCancellation(
    bookingId: number,
    guestEmail: string,
    bookingData: {
      guest_name: string;
      venue_name: string;
      booking_date: string;
      booking_time: string;
      party_size: string;
      booking_reference: string;
    },
    venueId: string
  ): Promise<boolean> {
    try {
      // Get venue settings
      const { data: venueSettings } = await supabase
        .from('venue_settings')
        .select('setting_key, setting_value')
        .eq('venue_id', venueId)
        .in('setting_key', ['from_email', 'from_name', 'email_signature']);

      const emailSettings: Record<string, string> = {};
      venueSettings?.forEach(setting => {
        try {
          const parsedValue = typeof setting.setting_value === 'string' 
            ? JSON.parse(setting.setting_value) 
            : setting.setting_value;
          emailSettings[setting.setting_key] = String(parsedValue || '');
        } catch {
          emailSettings[setting.setting_key] = String(setting.setting_value || '');
        }
      });

      // Use cancellation template
      const templateVariables = {
        guest_name: bookingData.guest_name,
        venue_name: bookingData.venue_name,
        booking_date: bookingData.booking_date,
        booking_time: bookingData.booking_time,
        party_size: bookingData.party_size,
        booking_reference: bookingData.booking_reference,
        email_signature: emailSettings.email_signature || 'Best regards,\nYour Venue Team',
      };

      const processedTemplate = await emailTemplateService.processTemplate(
        'booking_cancelled',
        venueId,
        templateVariables
      );

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: guestEmail,
          subject: processedTemplate?.subject || `Booking Cancelled - ${bookingData.venue_name}`,
          html: processedTemplate?.html || this.getDefaultCancellationTemplate(bookingData, emailSettings),
          from_email: emailSettings.from_email || 'noreply@grace-os.co.uk',
          from_name: emailSettings.from_name || bookingData.venue_name,
        },
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to send cancellation email:', error);
      return false;
    }
  },

  /**
   * Send booking modification email
   */
  async sendModification(
    bookingId: number,
    guestEmail: string,
    bookingData: {
      guest_name: string;
      venue_name: string;
      booking_date: string;
      booking_time: string;
      party_size: string;
      booking_reference: string;
    },
    venueId: string
  ): Promise<boolean> {
    try {
      // Get venue settings
      const { data: venueSettings } = await supabase
        .from('venue_settings')
        .select('setting_key, setting_value')
        .eq('venue_id', venueId)
        .in('setting_key', ['from_email', 'from_name', 'email_signature']);

      const emailSettings: Record<string, string> = {};
      venueSettings?.forEach(setting => {
        try {
          const parsedValue = typeof setting.setting_value === 'string' 
            ? JSON.parse(setting.setting_value) 
            : setting.setting_value;
          emailSettings[setting.setting_key] = String(parsedValue || '');
        } catch {
          emailSettings[setting.setting_key] = String(setting.setting_value || '');
        }
      });

      // Generate new tokens for the modified booking
      const tokens = await emailTemplateService.generateBookingTokens(bookingId);
      const baseUrl = window.location.origin;

      const templateVariables = {
        guest_name: bookingData.guest_name,
        venue_name: bookingData.venue_name,
        booking_date: bookingData.booking_date,
        booking_time: bookingData.booking_time,
        party_size: bookingData.party_size,
        booking_reference: bookingData.booking_reference,
        email_signature: emailSettings.email_signature || 'Best regards,\nYour Venue Team',
        cancel_link: `${baseUrl}/cancel-booking?token=${tokens.cancelToken}`,
        modify_link: `${baseUrl}/modify-booking?token=${tokens.modifyToken}`,
      };

      const processedTemplate = await emailTemplateService.processTemplate(
        'booking_modified',
        venueId,
        templateVariables
      );

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: guestEmail,
          subject: processedTemplate?.subject || `Booking Modified - ${bookingData.venue_name}`,
          html: processedTemplate?.html || this.getDefaultModificationTemplate(bookingData, emailSettings, templateVariables),
          from_email: emailSettings.from_email || 'noreply@grace-os.co.uk',
          from_name: emailSettings.from_name || bookingData.venue_name,
        },
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to send modification email:', error);
      return false;
    }
  },

  /**
   * Send no-show email
   */
  async sendNoShow(
    bookingId: number,
    guestEmail: string,
    bookingData: {
      guest_name: string;
      venue_name: string;
      booking_date: string;
      booking_time: string;
      party_size: string;
      booking_reference: string;
    },
    venueId: string
  ): Promise<boolean> {
    try {
      // Get venue settings
      const { data: venueSettings } = await supabase
        .from('venue_settings')
        .select('setting_key, setting_value')
        .eq('venue_id', venueId)
        .in('setting_key', ['from_email', 'from_name', 'email_signature']);

      const emailSettings: Record<string, string> = {};
      venueSettings?.forEach(setting => {
        try {
          const parsedValue = typeof setting.setting_value === 'string' 
            ? JSON.parse(setting.setting_value) 
            : setting.setting_value;
          emailSettings[setting.setting_key] = String(parsedValue || '');
        } catch {
          emailSettings[setting.setting_key] = String(setting.setting_value || '');
        }
      });

      const templateVariables = {
        guest_name: bookingData.guest_name,
        venue_name: bookingData.venue_name,
        booking_date: bookingData.booking_date,
        booking_time: bookingData.booking_time,
        party_size: bookingData.party_size,
        booking_reference: bookingData.booking_reference,
        email_signature: emailSettings.email_signature || 'Best regards,\nYour Venue Team',
      };

      const processedTemplate = await emailTemplateService.processTemplate(
        'booking_no_show',
        venueId,
        templateVariables
      );

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: guestEmail,
          subject: processedTemplate?.subject || `We missed you - ${bookingData.venue_name}`,
          html: processedTemplate?.html || this.getDefaultNoShowTemplate(bookingData, emailSettings),
          from_email: emailSettings.from_email || 'noreply@grace-os.co.uk',
          from_name: emailSettings.from_name || bookingData.venue_name,
        },
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to send no-show email:', error);
      return false;
    }
  },

  /**
   * Send walk-in confirmation email
   */
  async sendWalkInConfirmation(
    bookingId: number,
    guestEmail: string,
    bookingData: {
      guest_name: string;
      venue_name: string;
      booking_date: string;
      booking_time: string;
      party_size: string;
      booking_reference: string;
    },
    venueId: string
  ): Promise<boolean> {
    try {
      // Get venue settings
      const { data: venueSettings } = await supabase
        .from('venue_settings')
        .select('setting_key, setting_value')
        .eq('venue_id', venueId)
        .in('setting_key', ['from_email', 'from_name', 'email_signature']);

      const emailSettings: Record<string, string> = {};
      venueSettings?.forEach(setting => {
        try {
          const parsedValue = typeof setting.setting_value === 'string' 
            ? JSON.parse(setting.setting_value) 
            : setting.setting_value;
          emailSettings[setting.setting_key] = String(parsedValue || '');
        } catch {
          emailSettings[setting.setting_key] = String(setting.setting_value || '');
        }
      });

      const templateVariables = {
        guest_name: bookingData.guest_name,
        venue_name: bookingData.venue_name,
        booking_date: bookingData.booking_date,
        booking_time: bookingData.booking_time,
        party_size: bookingData.party_size,
        booking_reference: bookingData.booking_reference,
        email_signature: emailSettings.email_signature || 'Best regards,\nYour Venue Team',
      };

      const processedTemplate = await emailTemplateService.processTemplate(
        'walk_in_confirmation',
        venueId,
        templateVariables
      );

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: guestEmail,
          subject: processedTemplate?.subject || `Thanks for visiting - ${bookingData.venue_name}`,
          html: processedTemplate?.html || this.getDefaultWalkInTemplate(bookingData, emailSettings),
          from_email: emailSettings.from_email || 'noreply@grace-os.co.uk',
          from_name: emailSettings.from_name || bookingData.venue_name,
        },
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to send walk-in confirmation email:', error);
      return false;
    }
  },

  // Default templates for fallback
  getDefaultCancellationTemplate(bookingData: any, emailSettings: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ea580c; font-size: 32px; margin: 0;">grace</h1>
          <p style="color: #64748b; margin: 5px 0;">Booking Cancelled</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Your booking has been cancelled</h2>
          <p>Dear ${bookingData.guest_name},</p>
          <p>Your booking at ${bookingData.venue_name} has been cancelled as requested.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #ea580c;">Cancelled Booking Details</h3>
            <p><strong>Reference:</strong> ${bookingData.booking_reference}</p>
            <p><strong>Date:</strong> ${bookingData.booking_date}</p>
            <p><strong>Time:</strong> ${bookingData.booking_time}</p>
            <p><strong>Party Size:</strong> ${bookingData.party_size}</p>
          </div>
          <p>We hope to see you again soon!</p>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>${emailSettings.email_signature || 'Best regards,\nYour Venue Team'}</p>
        </div>
      </div>
    `;
  },

  getDefaultModificationTemplate(bookingData: any, emailSettings: any, templateVariables: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ea580c; font-size: 32px; margin: 0;">grace</h1>
          <p style="color: #64748b; margin: 5px 0;">Booking Modified</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Your booking has been updated</h2>
          <p>Dear ${bookingData.guest_name},</p>
          <p>Your booking at ${bookingData.venue_name} has been successfully updated.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #ea580c;">Updated Booking Details</h3>
            <p><strong>Reference:</strong> ${bookingData.booking_reference}</p>
            <p><strong>Date:</strong> ${bookingData.booking_date}</p>
            <p><strong>Time:</strong> ${bookingData.booking_time}</p>
            <p><strong>Party Size:</strong> ${bookingData.party_size}</p>
          </div>
          ${templateVariables.cancel_link || templateVariables.modify_link ? `
          <div style="text-align: center; margin: 20px 0;">
            ${templateVariables.modify_link ? `<a href="${templateVariables.modify_link}" style="background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Modify Again</a>` : ''}
            ${templateVariables.cancel_link ? `<a href="${templateVariables.cancel_link}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Cancel Booking</a>` : ''}
          </div>
          ` : ''}
          <p>We look forward to seeing you!</p>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>${emailSettings.email_signature || 'Best regards,\nYour Venue Team'}</p>
        </div>
      </div>
    `;
  },

  getDefaultNoShowTemplate(bookingData: any, emailSettings: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ea580c; font-size: 32px; margin: 0;">grace</h1>
          <p style="color: #64748b; margin: 5px 0;">We missed you today</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">We missed you today</h2>
          <p>Dear ${bookingData.guest_name},</p>
          <p>We noticed you weren't able to make it to your booking at ${bookingData.venue_name} today.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #ea580c;">Missed Booking Details</h3>
            <p><strong>Reference:</strong> ${bookingData.booking_reference}</p>
            <p><strong>Date:</strong> ${bookingData.booking_date}</p>
            <p><strong>Time:</strong> ${bookingData.booking_time}</p>
            <p><strong>Party Size:</strong> ${bookingData.party_size}</p>
          </div>
          <p>We understand that plans can change. We'd love to welcome you another time!</p>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>${emailSettings.email_signature || 'Best regards,\nYour Venue Team'}</p>
        </div>
      </div>
    `;
  },

  getDefaultWalkInTemplate(bookingData: any, emailSettings: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ea580c; font-size: 32px; margin: 0;">grace</h1>
          <p style="color: #64748b; margin: 5px 0;">Thanks for visiting!</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Thanks for visiting us!</h2>
          <p>Dear ${bookingData.guest_name},</p>
          <p>Thank you for visiting ${bookingData.venue_name} today as a walk-in guest.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #ea580c;">Visit Details</h3>
            <p><strong>Reference:</strong> ${bookingData.booking_reference}</p>
            <p><strong>Date:</strong> ${bookingData.booking_date}</p>
            <p><strong>Time:</strong> ${bookingData.booking_time}</p>
            <p><strong>Party Size:</strong> ${bookingData.party_size}</p>
          </div>
          <p>We hope you enjoyed your experience and look forward to welcoming you back soon!</p>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>${emailSettings.email_signature || 'Best regards,\nYour Venue Team'}</p>
        </div>
      </div>
    `;
  },
};