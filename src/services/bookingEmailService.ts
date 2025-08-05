import { supabase } from "@/integrations/supabase/client";
import emailService from "./emailService";

class BookingEmailService {
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
      const success = await emailService.sendBookingConfirmation(
        guestEmail,
        bookingData,
        venue_slug
      );
      return success;
    } catch (error) {
      console.error("Failed to send booking confirmation:", error);
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
      const success = await emailService.sendBookingReminder(
        guestEmail,
        bookingData,
        venue_slug
      );
      return success;
    } catch (error) {
      console.error("Failed to send booking reminder:", error);
      return false;
    }
  }
}

export const bookingEmailService = new BookingEmailService();
