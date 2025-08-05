
import { emailService } from "@/services/emailService";
import { useToast } from "@/hooks/use-toast";

export const useEmailService = () => {
  const { toast } = useToast();

  const sendBookingConfirmation = async (
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
  ) => {
    try {
      const success = await emailService.sendBookingConfirmation(
        guestEmail,
        bookingData,
        venue_slug
      );

      if (success) {
        toast({
          title: "Confirmation sent",
          description: `Booking confirmation sent to ${guestEmail}`,
        });
      } else {
        throw new Error("Failed to send email");
      }

      return success;
    } catch (error) {
      console.error("Failed to send booking confirmation:", error);
      toast({
        title: "Email failed",
        description: "Failed to send booking confirmation email",
        variant: "destructive",
      });
      return false;
    }
  };

  const sendBookingReminder = async (
    guestEmail: string,
    bookingData: {
      guest_name: string;
      venue_name: string;
      booking_date: string;
      booking_time: string;
      party_size: string;
      booking_reference: string;
    },
    venueId: string,
    reminderType: 'booking_reminder_24h' | 'booking_reminder_2h' = 'booking_reminder_24h'
  ) => {
    try {
      const success = await emailService.sendReminderEmail(
        guestEmail,
        bookingData,
        reminderType,
        venueId
      );

      if (success) {
        toast({
          title: "Reminder sent",
          description: `Booking reminder sent to ${guestEmail}`,
        });
      } else {
        throw new Error("Failed to send email");
      }

      return success;
    } catch (error) {
      console.error("Failed to send booking reminder:", error);
      toast({
        title: "Email failed",
        description: "Failed to send booking reminder email",
        variant: "destructive",
      });
      return false;
    }
  };

  const sendUserInvitation = async (
    userEmail: string,
    invitationData: {
      venue_name: string;
      invitation_link: string;
    }
  ) => {
    try {
      // This functionality would need to be implemented in emailService if needed
      // For now, return a placeholder implementation
      console.warn("sendUserInvitation not implemented in emailService");
      
      toast({
        title: "Feature not available",
        description: "User invitation emails are not currently supported",
        variant: "destructive",
      });
      
      return false;
    } catch (error) {
      console.error("Failed to send user invitation:", error);
      toast({
        title: "Email failed",
        description: "Failed to send invitation email",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    sendBookingConfirmation,
    sendBookingReminder,
    sendUserInvitation,
  };
};
