
import { supabase } from "@/integrations/supabase/client";

class EmailService {
  async sendBookingConfirmation(
    guestEmail: string,
    bookingData: {
      guest_name: string;
      venue_name: string;
      booking_date: string;
      booking_time: string;
      party_size: string;
      booking_reference: string;
    },
    venue_slug: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'booking_confirmation',
          to: guestEmail,
          data: bookingData,
          venue_slug
        }
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }

  async sendBookingReminder(
    guestEmail: string,
    bookingData: {
      guest_name: string;
      venue_name: string;
      booking_date: string;
      booking_time: string;
      party_size: string;
      booking_reference: string;
    },
    venue_slug: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'booking_reminder',
          to: guestEmail,
          data: bookingData,
          venue_slug
        }
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }

  async sendUserInvitation(
    userEmail: string,
    invitationData: {
      venue_name: string;
      invitation_link: string;
    }
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'user_invitation',
          to: userEmail,
          data: invitationData
        }
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
export default emailService;
