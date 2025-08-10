
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BookingCreationData {
  guestDetails: {
    name: string;
    email: string;
    phone?: string;
    notes?: string;
    marketingOptIn: boolean;
    termsAccepted: boolean;
  };
  bookingData: {
    date: Date;
    time: string;
    partySize: number;
    service: any;
  };
  venueId: string;
}

export const useBookingCreation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const createOrUpdateGuest = async (guestDetails: any, venueId: string) => {
    // Check if guest exists by email or phone
    const { data: existingGuest } = await supabase
      .from('guests')
      .select('*')
      .eq('venue_id', venueId)
      .or(`email.eq.${guestDetails.email},phone.eq.${guestDetails.phone || ''}`)
      .maybeSingle();

    let guestId: string;

    if (existingGuest) {
      // Update existing guest
      const { data: updatedGuest, error } = await supabase
        .from('guests')
        .update({
          name: guestDetails.name,
          phone: guestDetails.phone || null,
          notes: guestDetails.notes || null,
          opt_in_marketing: guestDetails.marketingOptIn,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingGuest.id)
        .select()
        .single();

      if (error) throw error;
      guestId = updatedGuest.id;
    } else {
      // Create new guest
      const { data: newGuest, error } = await supabase
        .from('guests')
        .insert({
          name: guestDetails.name,
          email: guestDetails.email,
          phone: guestDetails.phone || null,
          notes: guestDetails.notes || null,
          opt_in_marketing: guestDetails.marketingOptIn,
          venue_id: venueId,
        })
        .select()
        .single();

      if (error) throw error;
      guestId = newGuest.id;
    }

    return guestId;
  };

  const createBooking = async (data: BookingCreationData) => {
    setIsCreating(true);
    
    try {
      const { guestDetails, bookingData, venueId } = data;
      
      // Create or update guest
      const guestId = await createOrUpdateGuest(guestDetails, venueId);

      // Calculate end time (default 2 hours for now)
      const bookingDateTime = new Date(`${bookingData.date.toISOString().split('T')[0]}T${bookingData.time}`);
      const endTime = new Date(bookingDateTime.getTime() + (2 * 60 * 60 * 1000));

      // Create the booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          guest_name: guestDetails.name,
          email: guestDetails.email,
          phone: guestDetails.phone || null,
          party_size: bookingData.partySize,
          booking_date: bookingData.date.toISOString().split('T')[0],
          booking_time: bookingData.time,
          service: bookingData.service?.title || 'Dinner',
          notes: guestDetails.notes || null,
          status: 'confirmed',
          duration_minutes: 120,
          end_time: endTime.toTimeString().split(' ')[0],
          venue_id: venueId,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      toast({
        title: "Booking confirmed",
        description: "Your reservation has been successfully created.",
      });

      return booking;
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createBooking,
    isCreating,
  };
};
