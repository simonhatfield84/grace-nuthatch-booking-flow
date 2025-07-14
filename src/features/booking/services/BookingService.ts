
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfDay } from "date-fns";
import { Service, AvailabilitySlot } from "../types/booking";
import { EnhancedAvailabilityService } from "@/services/enhancedAvailabilityService";

export class BookingService {
  private static cache = new Map<string, { data: any, timestamp: number }>();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static clearCache() {
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

    const cacheKey = `dates-${venueId}-${partySize}-${format(start, 'yyyy-MM-dd')}-${format(end, 'yyyy-MM-dd')}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Get booking windows for this venue
      const { data: bookingWindows, error } = await supabase
        .from('booking_windows')
        .select('*')
        .eq('venue_id', venueId);

      if (error || !bookingWindows?.length) {
        console.error('Error fetching booking windows:', error);
        return [];
      }

      // Generate date range and check availability
      const availableDates: string[] = [];
      let currentDate = start;

      while (currentDate <= end) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();

        // Check if any booking window covers this day
        const hasAvailableWindow = bookingWindows.some(window => 
          window.days.includes(dayName) &&
          this.isDateInWindow(dateStr, window.start_date, window.end_date) &&
          !this.isDateBlackedOut(dateStr, window.blackout_periods)
        );

        if (hasAvailableWindow) {
          // Additional check for table availability
          const hasTableAvailability = await this.checkTableAvailability(venueId, dateStr, partySize);
          if (hasTableAvailability) {
            availableDates.push(dateStr);
          }
        }

        currentDate = addDays(currentDate, 1);
      }

      this.cache.set(cacheKey, { data: availableDates, timestamp: Date.now() });
      return availableDates;
    } catch (error) {
      console.error('Error getting available dates:', error);
      return [];
    }
  }

  // Get available time slots for a specific date
  static async getAvailableTimeSlots(
    venueId: string,
    date: string,
    partySize: number
  ): Promise<AvailabilitySlot[]> {
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

  // Get available services for venue and party size
  static async getAvailableServices(
    venueId: string,
    partySize: number,
    date?: string
  ): Promise<Service[]> {
    try {
      const { data: services, error } = await supabase
        .from('services')
        .select('*')
        .eq('active', true)
        .eq('online_bookable', true)
        .lte('min_guests', partySize)
        .gte('max_guests', partySize)
        .order('title');

      if (error) throw error;

      return services || [];
    } catch (error) {
      console.error('Error fetching services:', error);
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
      console.log(`🔍 Checking table availability for ${partySize} guests on ${date}`);
      
      // Use enhanced availability check that considers join groups
      const availability = await EnhancedAvailabilityService.checkAvailabilityWithJoinGroups(
        venueId,
        date,
        '17:00', // Start of service
        '22:00', // End of service
        partySize,
        120 // Default duration
      );

      // Check if any time slot has availability
      const hasAnyAvailability = Object.values(availability).some(slot => slot.available);
      
      console.log(`📊 Date ${date} availability for ${partySize} guests: ${hasAnyAvailability ? 'AVAILABLE' : 'NOT AVAILABLE'}`);
      
      return hasAnyAvailability;
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
      console.log(`🕐 Checking time slot availability: ${time} for ${partySize} guests`);
      
      // Check if this time slot is blocked first
      const isBlocked = await this.checkBlockedTimeSlot(venueId, date, time);
      if (isBlocked) {
        console.log(`🚫 Time slot ${time} is blocked`);
        return false;
      }
      
      // Use enhanced availability check that considers join groups and remaining tables
      const availability = await EnhancedAvailabilityService.checkAvailabilityWithJoinGroups(
        venueId,
        date,
        time, // Check just this specific time
        time, // Same time for start and end
        partySize,
        120 // Default duration
      );

      const isAvailable = availability[time]?.available || false;
      const reason = availability[time]?.reason || 'Unknown';
      
      console.log(`   ${isAvailable ? '✅' : '❌'} ${time}: ${reason}`);
      
      return isAvailable;
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
