
import { supabase } from "@/integrations/supabase/client";
import { addMinutes, format } from "date-fns";

export interface TimeSlotSuggestion {
  time: string;
  availableDuration: number;
  tableId: number;
  tableLabel: string;
  reason: string;
  score: number; // Higher score = better suggestion
}

export interface TimeSlotOptimizationResult {
  requestedTimeAvailable: boolean;
  earlierSlots: TimeSlotSuggestion[];
  laterSlots: TimeSlotSuggestion[];
  flexibleDurationOptions: Array<{
    duration: number;
    availableAt: string;
  }>;
}

export class TimeSlotService {
  /**
   * Find optimal time slots for walk-in when requested time has conflicts
   */
  static async optimizeTimeSlots(
    tableId: number,
    requestedTime: string,
    partySize: number,
    requestedDuration: number,
    date: string,
    venueId: string
  ): Promise<TimeSlotOptimizationResult> {
    try {
      // Get venue hours to determine search window
      const { data: venueHours } = await supabase
        .from('venue_settings')
        .select('setting_value')
        .eq('venue_id', venueId)
        .eq('setting_key', 'operating_hours')
        .maybeSingle();

      const operatingHours = venueHours?.setting_value as any || { 
        start: '10:00', 
        end: '22:00' 
      };

      // Get table and booking data
      const { data: table } = await supabase
        .from('tables')
        .select('*')
        .eq('id', tableId)
        .single();

      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', date)
        .eq('table_id', tableId)
        .eq('venue_id', venueId)
        .neq('status', 'cancelled')
        .neq('status', 'finished')
        .order('booking_time');

      if (!table || !bookings) {
        return {
          requestedTimeAvailable: false,
          earlierSlots: [],
          laterSlots: [],
          flexibleDurationOptions: []
        };
      }

      const [reqHours, reqMinutes] = requestedTime.split(':').map(Number);
      const requestedDateTime = new Date();
      requestedDateTime.setHours(reqHours, reqMinutes, 0, 0);

      // Check if requested time is available
      const requestedTimeAvailable = this.isTimeSlotAvailable(
        requestedTime, 
        requestedDuration, 
        bookings, 
        partySize, 
        table.seats
      );

      const earlierSlots: TimeSlotSuggestion[] = [];
      const laterSlots: TimeSlotSuggestion[] = [];
      const flexibleDurationOptions: Array<{duration: number; availableAt: string}> = [];

      // Generate time slots to check (15-minute intervals)
      const timeSlots = this.generateTimeSlots(operatingHours.start, operatingHours.end);

      for (const timeSlot of timeSlots) {
        const [slotHours, slotMinutes] = timeSlot.split(':').map(Number);
        const slotDateTime = new Date();
        slotDateTime.setHours(slotHours, slotMinutes, 0, 0);

        // Skip requested time
        if (timeSlot === requestedTime) continue;

        const availability = this.getTimeSlotAvailability(
          timeSlot,
          requestedDuration,
          bookings,
          partySize,
          table.seats
        );

        if (availability.available) {
          const suggestion: TimeSlotSuggestion = {
            time: timeSlot,
            availableDuration: availability.maxDuration,
            tableId: table.id,
            tableLabel: table.label,
            reason: this.getTimeSlotReason(timeSlot, requestedTime, availability.maxDuration, requestedDuration),
            score: this.calculateTimeSlotScore(timeSlot, requestedTime, availability.maxDuration, requestedDuration)
          };

          if (slotDateTime < requestedDateTime) {
            earlierSlots.push(suggestion);
          } else {
            laterSlots.push(suggestion);
          }

          // Add flexible duration options
          if (availability.maxDuration !== requestedDuration) {
            flexibleDurationOptions.push({
              duration: availability.maxDuration,
              availableAt: timeSlot
            });
          }
        }
      }

      // Sort suggestions by score (best first)
      earlierSlots.sort((a, b) => b.score - a.score);
      laterSlots.sort((a, b) => b.score - a.score);

      // Remove duplicate flexible duration options
      const uniqueFlexibleOptions = flexibleDurationOptions.filter((option, index, self) =>
        index === self.findIndex(o => o.duration === option.duration)
      ).sort((a, b) => b.duration - a.duration);

      return {
        requestedTimeAvailable,
        earlierSlots: earlierSlots.slice(0, 3),
        laterSlots: laterSlots.slice(0, 3),
        flexibleDurationOptions: uniqueFlexibleOptions.slice(0, 3)
      };

    } catch (error) {
      console.error('Error optimizing time slots:', error);
      return {
        requestedTimeAvailable: false,
        earlierSlots: [],
        laterSlots: [],
        flexibleDurationOptions: []
      };
    }
  }

  private static generateTimeSlots(startTime: string, endTime: string): string[] {
    const slots: string[] = [];
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    let currentTime = new Date();
    currentTime.setHours(startHours, startMinutes, 0, 0);

    const endDateTime = new Date();
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    while (currentTime < endDateTime) {
      const timeString = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
      slots.push(timeString);
      currentTime = addMinutes(currentTime, 15); // 15-minute intervals
    }

    return slots;
  }

  private static isTimeSlotAvailable(
    time: string,
    duration: number,
    bookings: any[],
    partySize: number,
    tableSeats: number
  ): boolean {
    if (tableSeats < partySize) return false;
    
    const availability = this.getTimeSlotAvailability(time, duration, bookings, partySize, tableSeats);
    return availability.available && availability.maxDuration >= duration;
  }

  private static getTimeSlotAvailability(
    time: string,
    requestedDuration: number,
    bookings: any[],
    partySize: number,
    tableSeats: number
  ): { available: boolean; maxDuration: number } {
    if (tableSeats < partySize) {
      return { available: false, maxDuration: 0 };
    }

    const [hours, minutes] = time.split(':').map(Number);
    const slotStart = new Date();
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + (requestedDuration * 60 * 1000));

    // Find conflicting bookings
    const conflicts = bookings.filter(booking => {
      const [bookingHours, bookingMinutes] = booking.booking_time.split(':').map(Number);
      const bookingStart = new Date();
      bookingStart.setHours(bookingHours, bookingMinutes, 0, 0);
      const bookingEnd = new Date(bookingStart.getTime() + ((booking.duration_minutes || 120) * 60 * 1000));

      return (slotStart < bookingEnd && slotEnd > bookingStart);
    });

    if (conflicts.length === 0) {
      return { available: true, maxDuration: requestedDuration };
    }

    // Find next booking to calculate max available duration
    const nextBookings = bookings
      .filter(booking => {
        const [bookingHours, bookingMinutes] = booking.booking_time.split(':').map(Number);
        const bookingStart = new Date();
        bookingStart.setHours(bookingHours, bookingMinutes, 0, 0);
        return bookingStart > slotStart;
      })
      .sort((a, b) => {
        const aTime = a.booking_time;
        const bTime = b.booking_time;
        return aTime.localeCompare(bTime);
      });

    if (nextBookings.length > 0) {
      const [nextHours, nextMinutes] = nextBookings[0].booking_time.split(':').map(Number);
      const nextBookingStart = new Date();
      nextBookingStart.setHours(nextHours, nextMinutes, 0, 0);
      
      const maxDuration = Math.floor((nextBookingStart.getTime() - slotStart.getTime()) / (1000 * 60));
      return { available: maxDuration >= 30, maxDuration: Math.max(30, maxDuration) };
    }

    return { available: false, maxDuration: 0 };
  }

  private static calculateTimeSlotScore(
    slotTime: string,
    requestedTime: string,
    availableDuration: number,
    requestedDuration: number
  ): number {
    const [slotHours, slotMinutes] = slotTime.split(':').map(Number);
    const [reqHours, reqMinutes] = requestedTime.split(':').map(Number);
    
    const slotMinutesFromMidnight = slotHours * 60 + slotMinutes;
    const reqMinutesFromMidnight = reqHours * 60 + reqMinutes;
    
    const timeDifference = Math.abs(slotMinutesFromMidnight - reqMinutesFromMidnight);
    const durationMatch = availableDuration >= requestedDuration ? 1 : availableDuration / requestedDuration;
    
    // Higher score for closer times and better duration match
    const timeScore = Math.max(0, 100 - timeDifference); // Closer = higher score
    const durationScore = durationMatch * 50; // Full duration = 50 points
    
    return timeScore + durationScore;
  }

  private static getTimeSlotReason(
    slotTime: string,
    requestedTime: string,
    availableDuration: number,
    requestedDuration: number
  ): string {
    const [slotHours] = slotTime.split(':').map(Number);
    const [reqHours] = requestedTime.split(':').map(Number);
    
    const timeDiff = Math.abs(slotHours * 60 + parseInt(slotTime.split(':')[1]) - 
                             reqHours * 60 - parseInt(requestedTime.split(':')[1]));
    
    if (timeDiff <= 15) {
      return "Very close to requested time";
    } else if (timeDiff <= 30) {
      return "Close to requested time";
    } else if (availableDuration >= requestedDuration) {
      return "Full duration available";
    } else {
      return `${availableDuration} minutes available`;
    }
  }
}
