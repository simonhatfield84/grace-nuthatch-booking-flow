
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfDay, parseISO } from "date-fns";

export class AvailabilityService {
  private static cache = new Map<string, { data: any, timestamp: number }>();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static clearCache() {
    console.log('🗑️ Clearing availability cache');
    this.cache.clear();
  }

  // Get available dates for a venue and party size
  static async getAvailableDates(
    venueId: string,
    partySize: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<string[]> {
    const start = startDate || startOfDay(new Date());
    const end = endDate || addDays(start, 90);

    console.log(`🔍 Getting available dates for venue ${venueId}, party size ${partySize}`);
    console.log(`📅 Date range: ${format(start, 'yyyy-MM-dd')} to ${format(end, 'yyyy-MM-dd')}`);

    const cacheKey = `dates-${venueId}-${partySize}-${format(start, 'yyyy-MM-dd')}-${format(end, 'yyyy-MM-dd')}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`✅ Using cached availability data (${cached.data.length} dates)`);
      return cached.data;
    }

    try {
      // Get booking windows for this venue
      const { data: bookingWindows, error: windowsError } = await supabase
        .from('booking_windows_public')
        .select('*')
        .eq('venue_id', venueId);

      if (windowsError) {
        console.error('❌ Error fetching booking windows:', windowsError);
        return [];
      }

      if (!bookingWindows?.length) {
        console.log(`❌ No booking windows found for venue ${venueId}`);
        return [];
      }

      console.log(`📋 Found ${bookingWindows.length} booking windows`);

      // Generate date range to check
      const datesToCheck: string[] = [];
      let currentDate = start;
      
      while (currentDate <= end) {
        datesToCheck.push(format(currentDate, 'yyyy-MM-dd'));
        currentDate = addDays(currentDate, 1);
      }

      console.log(`🗓️ Checking ${datesToCheck.length} dates`);

      // Check availability for each date
      const availableDates: string[] = [];

      for (const dateStr of datesToCheck) {
        const hasAvailability = await this.checkDateAvailability(venueId, dateStr, partySize, bookingWindows);
        if (hasAvailability) {
          availableDates.push(dateStr);
        }
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      console.log(`✅ Final result: ${availableDates.length} available dates out of ${datesToCheck.length} checked`);

      // Cache the results
      this.cache.set(cacheKey, {
        data: availableDates,
        timestamp: Date.now()
      });

      return availableDates.sort();

    } catch (error) {
      console.error('❌ Error in getAvailableDates:', error);
      return [];
    }
  }

  // Check if a specific date has availability
  static async checkDateAvailability(
    venueId: string,
    date: string,
    partySize: number,
    bookingWindows?: any[]
  ): Promise<boolean> {
    try {
      let windows = bookingWindows;
      
      if (!windows) {
        const { data, error } = await supabase
          .from('booking_windows_public')
          .select('*')
          .eq('venue_id', venueId);

        if (error || !data) {
          console.error('Error fetching booking windows:', error);
          return false;
        }
        windows = data;
      }

      const dateObj = parseISO(date);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();

      // Check if any booking window covers this day
      const applicableWindows = windows.filter(window => {
        const coversDay = window.days.includes(dayName);
        const inDateRange = this.isDateInWindow(date, window.start_date, window.end_date);
        const notBlackedOut = !this.isDateBlackedOut(date, window.blackout_periods);
        
        return coversDay && inDateRange && notBlackedOut;
      });

      if (applicableWindows.length === 0) {
        return false;
      }

      // Check table availability
      return await this.checkTableAvailability(venueId, date, partySize);

    } catch (error) {
      console.error('Error checking date availability:', error);
      return false;
    }
  }

  // Get available time slots for a specific date
  static async getAvailableTimeSlots(
    venueId: string,
    date: string,
    partySize: number
  ): Promise<Array<{ time: string; available: boolean; reason?: string }>> {
    const cacheKey = `times-${venueId}-${date}-${partySize}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Generate time slots (every 15 minutes from 17:00 to 22:00)
      const timeSlots: string[] = [];
      for (let hour = 17; hour <= 22; hour++) {
        for (let minute of [0, 15, 30, 45]) {
          if (hour === 22 && minute > 0) break;
          timeSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        }
      }

      // Check availability for each slot
      const availabilitySlots = await Promise.all(
        timeSlots.map(async (time) => {
          const available = await this.checkTimeSlotAvailability(venueId, date, time, partySize);
          return {
            time,
            available,
            reason: available ? undefined : 'No tables available'
          };
        })
      );

      this.cache.set(cacheKey, { data: availabilitySlots, timestamp: Date.now() });
      return availabilitySlots;
    } catch (error) {
      console.error('Error getting time slots:', error);
      return [];
    }
  }

  // Private helper methods
  private static isDateInWindow(date: string, startDate?: string | null, endDate?: string | null): boolean {
    if (!startDate && !endDate) return true;
    
    const checkDate = new Date(date);
    if (startDate && checkDate < new Date(startDate)) return false;
    if (endDate && checkDate > new Date(endDate)) return false;
    
    return true;
  }

  private static isDateBlackedOut(date: string, blackoutPeriods?: any): boolean {
    if (!blackoutPeriods) return false;
    
    try {
      const periods = Array.isArray(blackoutPeriods) ? blackoutPeriods : JSON.parse(blackoutPeriods);
      return periods.some((period: any) => {
        return date >= period.start_date && date <= period.end_date;
      });
    } catch {
      return false;
    }
  }

  private static async checkTableAvailability(venueId: string, date: string, partySize: number): Promise<boolean> {
    try {
      // Get tables that can accommodate the party size
      const { data: tables, error: tablesError } = await supabase
        .from('tables')
        .select('id, seats')
        .eq('venue_id', venueId)
        .eq('online_bookable', true)
        .eq('status', 'active');

      if (tablesError || !tables?.length) return false;

      // Check if any single table can accommodate the party
      const suitableSingleTable = tables.find(t => t.seats >= partySize);
      if (suitableSingleTable) {
        return true;
      }

      // Check join groups if no single table works
      const { data: joinGroups, error: joinGroupsError } = await supabase
        .from('join_groups')
        .select('*')
        .eq('venue_id', venueId);

      if (joinGroupsError || !joinGroups?.length) return false;

      // Check if any join group can accommodate the party
      const suitableJoinGroup = joinGroups.find(group => {
        // Check party size fits in group range
        if (partySize < group.min_party_size || partySize > group.max_party_size) {
          return false;
        }
        
        // Check if all tables in group exist and can accommodate the party together
        const groupTables = tables.filter(t => group.table_ids.includes(t.id));
        const totalSeats = groupTables.reduce((sum, t) => sum + t.seats, 0);
        
        return groupTables.length === group.table_ids.length && totalSeats >= partySize;
      });

      return !!suitableJoinGroup;
    } catch (error) {
      console.error('Error checking table availability:', error);
      return false;
    }
  }

  private static async checkTimeSlotAvailability(
    venueId: string,
    date: string,
    time: string,
    partySize: number
  ): Promise<boolean> {
    try {
      // Check if this time slot is blocked
      const isBlocked = await this.checkBlockedTimeSlot(venueId, date, time);
      if (isBlocked) {
        console.log(`🚫 Time slot ${time} is blocked`);
        return false;
      }

      // Get existing bookings for this time slot
      const { data: existingBookings, error } = await supabase
        .from('bookings')
        .select('table_id, party_size')
        .eq('venue_id', venueId)
        .eq('booking_date', date)
        .eq('booking_time', time)
        .in('status', ['confirmed', 'seated']);

      if (error) throw error;

      // Get available tables
      const { data: tables, error: tablesError } = await supabase
        .from('tables')
        .select('id, seats')
        .eq('venue_id', venueId)
        .eq('online_bookable', true)
        .eq('status', 'active')
        .gte('seats', partySize);

      if (tablesError || !tables) return false;

      // Check if any table is available (not booked at this time)
      const bookedTableIds = new Set(existingBookings?.map(b => b.table_id) || []);
      const availableTables = tables.filter(table => !bookedTableIds.has(table.id));

      return availableTables.length > 0;
    } catch (error) {
      console.error('Error checking time slot availability:', error);
      return false;
    }
  }

  private static async checkBlockedTimeSlot(venueId: string, date: string, time: string): Promise<boolean> {
    try {
      const { data: blocks, error } = await supabase
        .from('blocks')
        .select('start_time, end_time, table_ids')
        .eq('venue_id', venueId)
        .eq('date', date);

      if (error || !blocks) return false;

      // Check if the requested time falls within any block
      for (const block of blocks) {
        if (this.isTimeInBlock(time, block.start_time, block.end_time)) {
          // If block has no specific tables (table_ids is empty), it blocks all tables
          // If block has specific tables, it only blocks those tables
          return block.table_ids?.length === 0 || !block.table_ids;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking blocked time slots:', error);
      return false;
    }
  }

  private static isTimeInBlock(checkTime: string, blockStart: string, blockEnd: string): boolean {
    const check = this.parseTimeToMinutes(checkTime);
    const start = this.parseTimeToMinutes(blockStart);
    const end = this.parseTimeToMinutes(blockEnd);
    
    return check >= start && check < end;
  }

  private static parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
