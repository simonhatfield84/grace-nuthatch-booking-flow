import { supabase } from "@/integrations/supabase/client";
import { EmailTemplateService, EmailTemplateVariables } from "./emailTemplateService";

interface BookingData {
  guest_name: string;
  venue_name: string;
  booking_date: string;
  booking_time: string;
  party_size: string;
  booking_reference: string;
  booking_id?: number;
}

export const emailService = {
  async sendBookingConfirmation(
    guestEmail: string,
    bookingData: BookingData,
    venueSlug: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('send-branded-email', {
        body: {
          to: guestEmail,
          template: 'booking_confirmation',
          booking_data: bookingData,
          venue_slug: venueSlug
        }
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to send booking confirmation:', error);
      return false;
    }
  },

  async sendPaymentRequest(
    guestEmail: string,
    bookingData: BookingData & { payment_amount: string; payment_link: string },
    venueId: string
  ): Promise<boolean> {
    try {
      const templateVariables: EmailTemplateVariables = {
        guest_name: bookingData.guest_name,
        venue_name: bookingData.venue_name,
        booking_reference: bookingData.booking_reference,
        booking_date: bookingData.booking_date,
        booking_time: bookingData.booking_time,
        party_size: bookingData.party_size,
        payment_amount: bookingData.payment_amount,
        payment_link: bookingData.payment_link,
        email_signature: 'Best regards,\nThe Nuthatch Team'
      };

      const { data, error } = await supabase.functions.invoke('send-payment-request', {
        body: {
          guest_email: guestEmail,
          venue_id: venueId,
          template_variables: templateVariables
        }
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to send payment request:', error);
      return false;
    }
  },

  async sendReminderEmail(
    guestEmail: string,
    bookingData: BookingData,
    reminderType: 'booking_reminder_24h' | 'booking_reminder_2h',
    venueId: string
  ): Promise<boolean> {
    try {
      const templateVariables: EmailTemplateVariables = {
        guest_name: bookingData.guest_name,
        venue_name: bookingData.venue_name,
        booking_reference: bookingData.booking_reference,
        booking_date: bookingData.booking_date,
        booking_time: bookingData.booking_time,
        party_size: bookingData.party_size,
        email_signature: 'Best regards,\nThe Nuthatch Team'
      };

      await EmailTemplateService.sendTemplatedEmail(
        venueId,
        reminderType,
        guestEmail,
        templateVariables
      );

      return true;
    } catch (error) {
      console.error(`Failed to send ${reminderType}:`, error);
      return false;
    }
  }
};
