
import { supabase } from '@/integrations/supabase/client';

interface BookingDetails {
  id: number;
  guest_name: string;
  email: string;
  booking_date: string;
  booking_time: string;
  party_size: number;
  service?: string;
  venue?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
}

export const fetchBookingForEmail = async (bookingId: number): Promise<BookingDetails | null> => {
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id,
        guest_name,
        email,
        booking_date,
        booking_time,
        party_size,
        service,
        venues!inner(
          name,
          email,
          phone,
          address
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error('Error fetching booking:', error);
      return null;
    }

    return {
      ...booking,
      venue: booking.venues
    };
  } catch (error) {
    console.error('Error fetching booking for email:', error);
    return null;
  }
};

export const sendBookingConfirmation = async (bookingId: number) => {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        booking_id: bookingId,
        email_type: 'booking_confirmation'
      }
    });

    if (error) {
      console.error('Error sending confirmation email:', error);
      throw error;
    }

    console.log('✅ Confirmation email sent successfully');
  } catch (error) {
    console.error('Error in sendBookingConfirmation:', error);
    throw error;
  }
};
