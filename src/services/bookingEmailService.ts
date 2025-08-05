import { emailService } from "./emailService";
import { EmailTemplateService } from "./emailTemplateService";
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
      // Use the edge function for consistent email sending
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          booking_id: bookingId,
          guest_email: guestEmail,
          venue_id: venueId,
          email_type: 'booking_cancelled',
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
      // Use the edge function for consistent email sending
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          booking_id: bookingId,
          guest_email: guestEmail,
          venue_id: venueId,
          email_type: 'booking_modified',
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
      // Use the edge function for consistent email sending
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          booking_id: bookingId,
          guest_email: guestEmail,
          venue_id: venueId,
          email_type: 'booking_no_show',
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
      // Use the edge function for consistent email sending
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          booking_id: bookingId,
          guest_email: guestEmail,
          venue_id: venueId,
          email_type: 'walk_in_confirmation',
        },
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to send walk-in confirmation email:', error);
      return false;
    }
  },

  // Default templates for fallback with The Nuthatch branding
  getDefaultCancellationTemplate(bookingData: any, emailSettings: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 60px; width: auto; margin: 20px 0;" />
          <p style="color: #666; margin: 5px 0;">Booking Cancelled</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 8px;">
          <h2 style="color: #000; margin-top: 0;">Your booking has been cancelled</h2>
          <p>Dear ${bookingData.guest_name},</p>
          <p>Your booking at ${bookingData.venue_name} has been cancelled as requested.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd;">
            <h3 style="margin-top: 0; color: #000;">Cancelled Booking Details</h3>
            <p><strong>Reference:</strong> ${bookingData.booking_reference}</p>
            <p><strong>Date:</strong> ${bookingData.booking_date}</p>
            <p><strong>Time:</strong> ${bookingData.booking_time}</p>
            <p><strong>Party Size:</strong> ${bookingData.party_size}</p>
          </div>
          <p>We hope to see you again soon!</p>
        </div>
        <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
          <p style="white-space: pre-line;">${emailSettings.email_signature || 'Best regards,\nThe Nuthatch Team'}</p>
          <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
        </div>
      </div>
    `;
  },

  getDefaultModificationTemplate(bookingData: any, emailSettings: any, templateVariables: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 60px; width: auto; margin: 20px 0;" />
          <p style="color: #666; margin: 5px 0;">Booking Modified</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 8px;">
          <h2 style="color: #000; margin-top: 0;">Your booking has been updated</h2>
          <p>Dear ${bookingData.guest_name},</p>
          <p>Your booking at ${bookingData.venue_name} has been successfully updated.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd;">
            <h3 style="margin-top: 0; color: #000;">Updated Booking Details</h3>
            <p><strong>Reference:</strong> ${bookingData.booking_reference}</p>
            <p><strong>Date:</strong> ${bookingData.booking_date}</p>
            <p><strong>Time:</strong> ${bookingData.booking_time}</p>
            <p><strong>Party Size:</strong> ${bookingData.party_size}</p>
          </div>
          ${templateVariables.cancel_link || templateVariables.modify_link ? `
          <div style="text-align: center; margin: 20px 0;">
            ${templateVariables.modify_link ? `<a href="${templateVariables.modify_link}" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Modify Again</a>` : ''}
            ${templateVariables.cancel_link ? `<a href="${templateVariables.cancel_link}" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Cancel Booking</a>` : ''}
          </div>
          ` : ''}
          <p>We look forward to seeing you!</p>
        </div>
        <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
          <p style="white-space: pre-line;">${emailSettings.email_signature || 'Best regards,\nThe Nuthatch Team'}</p>
          <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
        </div>
      </div>
    `;
  },

  getDefaultNoShowTemplate(bookingData: any, emailSettings: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 60px; width: auto; margin: 20px 0;" />
          <p style="color: #666; margin: 5px 0;">We missed you today</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 8px;">
          <h2 style="color: #000; margin-top: 0;">We missed you today</h2>
          <p>Dear ${bookingData.guest_name},</p>
          <p>We noticed you weren't able to make it to your booking at ${bookingData.venue_name} today.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd;">
            <h3 style="margin-top: 0; color: #000;">Missed Booking Details</h3>
            <p><strong>Reference:</strong> ${bookingData.booking_reference}</p>
            <p><strong>Date:</strong> ${bookingData.booking_date}</p>
            <p><strong>Time:</strong> ${bookingData.booking_time}</p>
            <p><strong>Party Size:</strong> ${bookingData.party_size}</p>
          </div>
          <p>We understand that plans can change. We'd love to welcome you another time!</p>
        </div>
        <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
          <p style="white-space: pre-line;">${emailSettings.email_signature || 'Best regards,\nThe Nuthatch Team'}</p>
          <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
        </div>
      </div>
    `;
  },

  getDefaultWalkInTemplate(bookingData: any, emailSettings: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 60px; width: auto; margin: 20px 0;" />
          <p style="color: #666; margin: 5px 0;">Thanks for visiting!</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 8px;">
          <h2 style="color: #000; margin-top: 0;">Thanks for visiting us!</h2>
          <p>Dear ${bookingData.guest_name},</p>
          <p>Thank you for visiting ${bookingData.venue_name} today as a walk-in guest.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd;">
            <h3 style="margin-top: 0; color: #000;">Visit Details</h3>
            <p><strong>Reference:</strong> ${bookingData.booking_reference}</p>
            <p><strong>Date:</strong> ${bookingData.booking_date}</p>
            <p><strong>Time:</strong> ${bookingData.booking_time}</p>
            <p><strong>Party Size:</strong> ${bookingData.party_size}</p>
          </div>
          <p>We hope you enjoyed your experience and look forward to welcoming you back soon!</p>
        </div>
        <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
          <p style="white-space: pre-line;">${emailSettings.email_signature || 'Best regards,\nThe Nuthatch Team'}</p>
          <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
        </div>
      </div>
    `;
  },
};
