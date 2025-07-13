
import { supabase } from "@/integrations/supabase/client";
import { format, parse, addMinutes } from "date-fns";

interface BookingWindow {
  id: string;
  venue_id: string;
  service_id: string;
  days: string[];
  start_time: string;
  end_time: string;
  max_bookings_per_slot: number;
  start_date?: string;
  end_date?: string;
  blackout_periods?: any;
}

export class UnifiedAvailabilityService {
  /**
   * Check if a specific date has availability for a given party size
   */
  static async checkDateAvailability(
    venueId: string, // Now expects UUID
    date: string,
    partySize: number,
    bookingWindows: BookingWindow[]
  ): Promise<boolean> {
    try {
      console.log(`🔍 Checking availability for venue ${venueId} on ${date} for ${partySize} people`);

      // Filter booking windows for this venue
      const venueWindows = bookingWindows.filter(window => window.venue_id === venueId);
      
      if (venueWindows.length === 0) {
        console.log(`❌ No booking windows found for venue ${venueId}`);
        return false;
      }

      // Check if date falls within any booking window
      const dateObj = new Date(date);
      const dayOfWeek = format(dateObj, 'EEEE').toLowerCase();

      const applicableWindows = venueWindows.filter(window => {
        // Check if day is included
        if (!window.days.map(d => d.toLowerCase()).includes(dayOfWeek)) {
          return false;
        }

        // Check date range if specified
        if (window.start_date && new Date(date) < new Date(window.start_date)) {
          return false;
        }
        if (window.end_date && new Date(date) > new Date(window.end_date)) {
          return false;
        }

        return true;
      });

      if (applicableWindows.length === 0) {
        console.log(`❌ No applicable booking windows for ${dayOfWeek} on ${date}`);
        return false;
      }

      // Get tables that can accommodate the party size
      const { data: tables, error: tablesError } = await supabase
        .from('tables')
        .select('*')
        .eq('venue_id', venueId)
        .eq('online_bookable', true)
        .eq('status', 'active')
        .gte('seats', partySize);

      if (tablesError) {
        console.error('Error fetching tables:', tablesError);
        return false;
      }

      if (!tables || tables.length === 0) {
        console.log(`❌ No suitable tables found for ${partySize} people`);
        return false;
      }

      // Check for existing bookings on this date
      const { data: existingBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('venue_id', venueId)
        .eq('booking_date', date)
        .in('status', ['confirmed', 'seated']);

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        return false;
      }

      // For each applicable window, check if there are available time slots
      for (const window of applicableWindows) {
        const hasAvailability = await this.checkWindowAvailability(
          window,
          date,
          partySize,
          tables,
          existingBookings || []
        );

        if (hasAvailability) {
          console.log(`✅ Found availability in window ${window.id}`);
          return true;
        }
      }

      console.log(`❌ No availability found for ${date}`);
      return false;
    } catch (error) {
      console.error('Error checking date availability:', error);
      return false;
    }
  }

  /**
   * Check availability within a specific booking window
   */
  private static async checkWindowAvailability(
    window: BookingWindow,
    date: string,
    partySize: number,
    tables: any[],
    existingBookings: any[]
  ): Promise<boolean> {
    // Generate time slots for this window (15-minute intervals)
    const startTime = parse(window.start_time, 'HH:mm', new Date());
    const endTime = parse(window.end_time, 'HH:mm', new Date());
    
    let currentTime = startTime;
    
    while (currentTime < endTime) {
      const timeSlot = format(currentTime, 'HH:mm');
      
      // Check if any table is available at this time slot
      const availableTables = tables.filter(table => {
        return !this.isTableBooked(table.id, date, timeSlot, existingBookings);
      });

      if (availableTables.length > 0) {
        console.log(`✅ Found available table at ${timeSlot}`);
        return true;
      }

      // Move to next 15-minute slot
      currentTime = addMinutes(currentTime, 15);
    }

    return false;
  }

  /**
   * Check if a table is booked at a specific time
   */
  private static isTableBooked(
    tableId: number,
    date: string,
    timeSlot: string,
    existingBookings: any[]
  ): boolean {
    const tableBookings = existingBookings.filter(booking => 
      booking.table_id === tableId && booking.booking_date === date
    );

    for (const booking of tableBookings) {
      const bookingStart = parse(booking.booking_time, 'HH:mm', new Date());
      const bookingEnd = addMinutes(bookingStart, booking.duration_minutes || 120);
      const slotTime = parse(timeSlot, 'HH:mm', new Date());

      // Check if time slot overlaps with booking
      if (slotTime >= bookingStart && slotTime < bookingEnd) {
        return true;
      }
    }

    return false;
  }
}
