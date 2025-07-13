
import { supabase } from "@/integrations/supabase/client";
import { addDays, format, addMinutes } from "date-fns";

interface OptimizedAvailabilityData {
  tables: any[];
  joinGroups: any[];
  bookingWindows: any[];
  allBookings: any[];
}

interface TimeSlotConflict {
  tableId: number;
  startTime: string;
  endTime: string;
}

export class OptimizedAvailabilityService {
  private static cache = new Map<string, { data: OptimizedAvailabilityData; timestamp: number }>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Batch fetch all required data for availability checking
   */
  static async fetchAvailabilityData(venueId: string, startDate: Date, endDate: Date): Promise<OptimizedAvailabilityData> {
    const cacheKey = `${venueId}-${format(startDate, 'yyyy-MM-dd')}-${format(endDate, 'yyyy-MM-dd')}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    console.log(`🚀 Batch fetching availability data for ${venueId} from ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);

    // Fetch all data in parallel
    const [tablesResult, joinGroupsResult, bookingWindowsResult, bookingsResult] = await Promise.all([
      supabase
        .from('tables')
        .select('*')
        .eq('status', 'active')
        .eq('venue_id', venueId),
      
      supabase
        .from('join_groups')
        .select('*')
        .eq('venue_id', venueId),
      
      supabase
        .from('booking_windows')
        .select('*')
        .eq('venue_id', venueId),
      
      supabase
        .from('bookings')
        .select('*')
        .eq('venue_id', venueId)
        .gte('booking_date', format(startDate, 'yyyy-MM-dd'))
        .lte('booking_date', format(endDate, 'yyyy-MM-dd'))
        .neq('status', 'cancelled')
        .neq('status', 'finished')
    ]);

    const data: OptimizedAvailabilityData = {
      tables: tablesResult.data || [],
      joinGroups: joinGroupsResult.data || [],
      bookingWindows: bookingWindowsResult.data || [],
      allBookings: bookingsResult.data || []
    };

    // Cache the results
    this.cache.set(cacheKey, { data, timestamp: Date.now() });

    console.log(`📊 Fetched: ${data.tables.length} tables, ${data.joinGroups.length} groups, ${data.allBookings.length} bookings`);
    
    return data;
  }

  /**
   * Generate sample time slots for a given date (hourly instead of every 15 minutes)
   */
  static generateSampleTimeSlots(date: Date, bookingWindows: any[]): string[] {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayName = format(date, 'EEE').toLowerCase();
    
    // Find active booking windows for this day
    const activeWindows = bookingWindows.filter(window => 
      window.days.includes(dayName) &&
      (!window.start_date || dateStr >= window.start_date) &&
      (!window.end_date || dateStr <= window.end_date)
    );

    if (activeWindows.length === 0) return [];

    const timeSlots: string[] = [];
    
    for (const window of activeWindows) {
      const startHour = parseInt(window.start_time.split(':')[0]);
      const endHour = parseInt(window.end_time.split(':')[0]);
      
      // Sample every hour instead of every 15 minutes
      for (let hour = startHour; hour <= endHour; hour++) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
        if (!timeSlots.includes(timeSlot)) {
          timeSlots.push(timeSlot);
        }
      }
    }

    return timeSlots;
  }

  /**
   * Check if any time slot is available for a given party size on a specific date
   */
  static checkDateAvailability(
    date: Date,
    partySize: number,
    data: OptimizedAvailabilityData
  ): boolean {
    const dateStr = format(date, 'yyyy-MM-dd');
    const timeSlots = this.generateSampleTimeSlots(date, data.bookingWindows);
    
    if (timeSlots.length === 0) return false;

    // Get all conflicts for this date
    const dayBookings = data.allBookings.filter(booking => booking.booking_date === dateStr);
    
    // Check each sample time slot
    for (const timeSlot of timeSlots) {
      if (this.isTimeSlotAvailable(timeSlot, partySize, dayBookings, data)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Lightweight check if a specific time slot is available
   */
  private static isTimeSlotAvailable(
    timeSlot: string,
    partySize: number,
    dayBookings: any[],
    data: OptimizedAvailabilityData
  ): boolean {
    const conflicts = this.getTimeSlotConflicts(timeSlot, dayBookings);
    const occupiedTableIds = conflicts.map(c => c.tableId);

    // Check join groups first for larger parties
    if (partySize >= 7) {
      for (const group of data.joinGroups) {
        if (partySize >= group.min_party_size && 
            partySize <= group.max_party_size &&
            group.table_ids.every((tableId: number) => !occupiedTableIds.includes(tableId))) {
          return true;
        }
      }
    }

    // Check individual tables
    const availableTables = data.tables.filter(table => 
      !occupiedTableIds.includes(table.id) && table.seats >= partySize
    );

    return availableTables.length > 0;
  }

  /**
   * Get all table conflicts for a specific time slot
   */
  private static getTimeSlotConflicts(timeSlot: string, dayBookings: any[]): TimeSlotConflict[] {
    const conflicts: TimeSlotConflict[] = [];
    const slotTime = this.parseTime(timeSlot);
    const slotEndTime = addMinutes(slotTime, 120); // Default 2 hour duration

    for (const booking of dayBookings) {
      if (!booking.table_id) continue;

      const bookingStart = this.parseTime(booking.booking_time);
      const bookingEnd = addMinutes(bookingStart, booking.duration_minutes || 120);

      // Check for overlap
      if (this.timesOverlap(slotTime, slotEndTime, bookingStart, bookingEnd)) {
        conflicts.push({
          tableId: booking.table_id,
          startTime: booking.booking_time,
          endTime: format(bookingEnd, 'HH:mm')
        });
      }
    }

    return conflicts;
  }

  /**
   * Check if two time ranges overlap
   */
  private static timesOverlap(
    start1: Date, end1: Date, 
    start2: Date, end2: Date
  ): boolean {
    return start1 < end2 && end1 > start2;
  }

  /**
   * Parse time string to Date object
   */
  private static parseTime(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes || 0, 0, 0);
    return date;
  }

  /**
   * Process dates in parallel chunks
   */
  static async getAvailableDatesInChunks(
    venueId: string,
    partySize: number,
    chunkSize: number = 10
  ): Promise<Date[]> {
    const startDate = new Date();
    const endDate = addDays(new Date(), 60);
    
    // Fetch all data once
    const data = await this.fetchAvailabilityData(venueId, startDate, endDate);
    
    // Generate all dates to check
    const allDates: Date[] = [];
    for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
      allDates.push(new Date(d));
    }

    console.log(`🔍 Checking ${allDates.length} dates in chunks of ${chunkSize}`);

    // Process dates in chunks
    const availableDates: Date[] = [];
    
    for (let i = 0; i < allDates.length; i += chunkSize) {
      const chunk = allDates.slice(i, i + chunkSize);
      
      const chunkResults = await Promise.all(
        chunk.map(date => ({
          date,
          available: this.checkDateAvailability(date, partySize, data)
        }))
      );

      const availableInChunk = chunkResults
        .filter(result => result.available)
        .map(result => result.date);
      
      availableDates.push(...availableInChunk);
      
      console.log(`✅ Processed chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(allDates.length/chunkSize)}: ${availableInChunk.length} available`);
    }

    console.log(`🎯 Total available dates: ${availableDates.length}`);
    return availableDates;
  }

  /**
   * Clear cache when needed
   */
  static clearCache(): void {
    this.cache.clear();
  }
}
