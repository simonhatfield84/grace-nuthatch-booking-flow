
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
        return !this.isTableBooked(table.id, date, timeSlot, existingBookings, 120);
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

  // Note: isTableBooked method moved below with enhanced duration support

  /**
   * Check if a specific time slot is available for a given party size
   */
  static async checkTimeSlotAvailability(
    venueId: string,
    date: string,
    timeSlot: string,
    partySize: number,
    durationMinutes: number = 120
  ): Promise<{
    available: boolean;
    reason?: string;
    suggestedTimes?: string[];
  }> {
    try {
      console.log(`🕐 Checking time slot ${timeSlot} on ${date} for ${partySize} people`);

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
        return { available: false, reason: 'System error' };
      }

      if (!tables || tables.length === 0) {
        return { 
          available: false, 
          reason: `No tables available for ${partySize} people` 
        };
      }

      // Get existing bookings for this date
      const { data: existingBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('venue_id', venueId)
        .eq('booking_date', date)
        .in('status', ['confirmed', 'seated']);

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        return { available: false, reason: 'System error' };
      }

      // Check if any table is available at this time slot
      const availableTables = tables.filter(table => {
        return !this.isTableBooked(table.id, date, timeSlot, existingBookings || [], durationMinutes);
      });

      if (availableTables.length > 0) {
        console.log(`✅ Time slot ${timeSlot} is available`);
        return { available: true };
      }

      // Generate suggested alternative times if no availability
      const suggestedTimes = await this.generateAlternativeTimes(
        venueId,
        date,
        timeSlot,
        partySize,
        tables,
        existingBookings || [],
        durationMinutes
      );

      console.log(`❌ Time slot ${timeSlot} is not available`);
      return { 
        available: false, 
        reason: 'All tables are booked at this time',
        suggestedTimes 
      };

    } catch (error) {
      console.error('Error checking time slot availability:', error);
      return { available: false, reason: 'System error' };
    }
  }

  /**
   * Generate alternative time suggestions when requested slot is unavailable
   */
  private static async generateAlternativeTimes(
    venueId: string,
    date: string,
    requestedTime: string,
    partySize: number,
    tables: any[],
    existingBookings: any[],
    durationMinutes: number
  ): Promise<string[]> {
    const alternatives: string[] = [];
    
    // Generate time slots around the requested time (±2 hours)
    const requestedHour = parseInt(requestedTime.split(':')[0]);
    const requestedMinute = parseInt(requestedTime.split(':')[1]);
    
    // Check slots 2 hours before and after
    for (let hourOffset = -2; hourOffset <= 2; hourOffset++) {
      if (hourOffset === 0) continue; // Skip the requested time
      
      const checkHour = requestedHour + hourOffset;
      if (checkHour < 17 || checkHour > 22) continue; // Stay within service hours
      
      for (const minute of [0, 15, 30, 45]) {
        if (checkHour === 22 && minute > 0) break; // Stop at 22:00
        
        const timeSlot = `${checkHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Check if any table is available at this time
        const availableTables = tables.filter(table => {
          return !this.isTableBooked(table.id, date, timeSlot, existingBookings, durationMinutes);
        });
        
        if (availableTables.length > 0) {
          alternatives.push(timeSlot);
        }
        
        if (alternatives.length >= 3) break; // Limit to 3 suggestions
      }
      
      if (alternatives.length >= 3) break;
    }
    
    return alternatives.sort();
  }

  /**
   * Enhanced table booking check with duration support
   */
  private static isTableBooked(
    tableId: number,
    date: string,
    timeSlot: string,
    existingBookings: any[],
    durationMinutes: number = 120
  ): boolean {
    const tableBookings = existingBookings.filter(booking => 
      booking.table_id === tableId && booking.booking_date === date
    );

    for (const booking of tableBookings) {
      const bookingStart = parse(booking.booking_time, 'HH:mm', new Date());
      const bookingEnd = addMinutes(bookingStart, booking.duration_minutes || 120);
      const slotStart = parse(timeSlot, 'HH:mm', new Date());
      const slotEnd = addMinutes(slotStart, durationMinutes);

      // Check if time slots overlap
      if (slotStart < bookingEnd && slotEnd > bookingStart) {
        return true;
      }
    }

    return false;
  }
}
