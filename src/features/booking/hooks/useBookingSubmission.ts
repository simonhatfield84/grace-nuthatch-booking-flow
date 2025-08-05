
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookingFormData } from "../types/booking";

export const useBookingSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const submitBooking = async (
    formData: BookingFormData,
    venueId: string
  ) => {
    setIsSubmitting(true);

    try {
      const bookingData = {
        venue_id: venueId,
        guest_name: formData.guestDetails.name,
        email: formData.guestDetails.email,
        phone: formData.guestDetails.phone,
        party_size: formData.partySize,
        booking_date: formData.date.toISOString().split('T')[0],
        booking_time: formData.time,
        service: formData.serviceTitle || 'General Dining',
        notes: formData.guestDetails.specialRequests || '',
        status: 'confirmed', // All bookings are confirmed immediately
        duration_minutes: 120,
      };

      console.log('Submitting booking:', bookingData);

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (bookingError) {
        console.error('Booking creation error:', bookingError);
        throw bookingError;
      }

      console.log('✅ Booking created successfully:', booking);

      // Send confirmation email
      try {
        const { error: emailError } = await supabase.functions.invoke('send-email', {
          body: {
            booking_id: booking.id,
            guest_email: formData.guestDetails.email,
            venue_id: venueId,
            email_type: 'booking_confirmation'
          }
        });

        if (emailError) {
          console.error('Email sending failed:', emailError);
          // Don't throw error for email failure - booking is still successful
        } else {
          console.log('✅ Confirmation email sent successfully');
        }
      } catch (emailErr) {
        console.error('Email sending error:', emailErr);
        // Don't throw error for email failure
      }

      toast({
        title: "Booking Confirmed!",
        description: `Your booking for ${formData.partySize} guests on ${formData.date.toLocaleDateString()} has been confirmed.`,
      });

      return {
        success: true,
        bookingId: booking.id,
        message: "Booking confirmed successfully"
      };

    } catch (error: any) {
      console.error('Booking submission error:', error);
      
      const errorMessage = error?.message || 'Failed to create booking';
      
      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitBooking,
    isSubmitting
  };
};
