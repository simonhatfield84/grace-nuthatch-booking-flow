
import { supabase } from "@/integrations/supabase/client";
import { format, addMinutes, parseISO } from "date-fns";

export interface BookingConflict {
  hasConflict: boolean;
  maxAvailableDuration: number;
  nextBookingTime?: string;
  conflictingBooking?: {
    id: number;
    guest_name: string;
    booking_time: string;
    party_size: number;
  };
}

export class BookingConflictService {
  /**
   * Check for booking conflicts and calculate maximum available duration
   */
  static async checkWalkInConflicts(
    tableIds: number[],
    date: string,
    startTime: string,
    requestedDuration: number,
    venueId: string
  ): Promise<BookingConflict> {
    try {
      // Get all bookings for the specified tables on the given date
      const { data: existingBookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', date)
        .eq('venue_id', venueId)
        .in('table_id', tableIds)
        .neq('status', 'cancelled')
        .neq('status', 'finished')
        .order('booking_time');

      if (error) {
        console.error('Error fetching existing bookings:', error);
        return {
          hasConflict: false,
          maxAvailableDuration: requestedDuration
        };
      }

      if (!existingBookings || existingBookings.length === 0) {
        return {
          hasConflict: false,
          maxAvailableDuration: requestedDuration
        };
      }

      // Parse the start time
      const startDateTime = new Date(`${date}T${startTime}`);
      const requestedEndTime = addMinutes(startDateTime, requestedDuration);

      // Find the next booking that would conflict
      let nextConflictingBooking = null;
      let maxAvailableDuration = requestedDuration;

      for (const booking of existingBookings) {
        const bookingStartTime = new Date(`${date}T${booking.booking_time}`);
        const bookingDuration = booking.duration_minutes || 120;
        const bookingEndTime = addMinutes(bookingStartTime, bookingDuration);

        // Check if this booking starts after our requested start time
        if (bookingStartTime > startDateTime) {
          // Calculate how much time we have until this booking starts
          const availableMinutes = Math.floor(
            (bookingStartTime.getTime() - startDateTime.getTime()) / (1000 * 60)
          );

          if (availableMinutes < requestedDuration) {
            nextConflictingBooking = booking;
            maxAvailableDuration = Math.max(30, availableMinutes); // Minimum 30 minutes
            break;
          }
        }

        // Check if this booking overlaps with our requested time
        if (
          (bookingStartTime < requestedEndTime && bookingEndTime > startDateTime) ||
          (startDateTime < bookingEndTime && requestedEndTime > bookingStartTime)
        ) {
          // There's an overlap - calculate available time before this booking
          if (bookingStartTime > startDateTime) {
            const availableMinutes = Math.floor(
              (bookingStartTime.getTime() - startDateTime.getTime()) / (1000 * 60)
            );
            if (availableMinutes >= 30) { // Only consider if at least 30 minutes available
              nextConflictingBooking = booking;
              maxAvailableDuration = availableMinutes;
              break;
            }
          }
        }
      }

      const hasConflict = maxAvailableDuration < requestedDuration;

      return {
        hasConflict,
        maxAvailableDuration,
        nextBookingTime: nextConflictingBooking?.booking_time,
        conflictingBooking: nextConflictingBooking ? {
          id: nextConflictingBooking.id,
          guest_name: nextConflictingBooking.guest_name,
          booking_time: nextConflictingBooking.booking_time,
          party_size: nextConflictingBooking.party_size
        } : undefined
      };
    } catch (error) {
      console.error('Error checking booking conflicts:', error);
      return {
        hasConflict: false,
        maxAvailableDuration: requestedDuration
      };
    }
  }

  /**
   * Get the default walk-in duration from venue settings
   */
  static async getDefaultWalkInDuration(venueId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('venue_settings')
        .select('setting_value')
        .eq('venue_id', venueId)
        .eq('setting_key', 'walk_in_duration')
        .maybeSingle();

      if (error) {
        console.error('Error fetching walk-in duration setting:', error);
        return 120; // Default fallback
      }

      return (data?.setting_value as number) || 120;
    } catch (error) {
      console.error('Error getting default walk-in duration:', error);
      return 120;
    }
  }
}
