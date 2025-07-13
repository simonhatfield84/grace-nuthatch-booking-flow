
import { supabase } from "@/integrations/supabase/client";
import { addMinutes, format } from "date-fns";

interface Table {
  id: number;
  label: string;
  seats: number;
  section_id: number;
  join_groups: number[];
  priority_rank: number;
  venue_id: string;
  status: string;
}

interface JoinGroup {
  id: number;
  name: string;
  table_ids: number[];
  min_party_size: number;
  max_party_size: number;
}

interface Booking {
  id: number;
  table_id: number | null;
  party_size: number;
  booking_date: string;
  booking_time: string;
  status: string;
  duration_minutes?: number;
}

interface BookingPriority {
  id: number;
  party_size: number;
  item_type: 'table' | 'group';
  item_id: number;
  priority_rank: number;
}

interface BookingWindow {
  id: string;
  service_id: string;
  days: string[];
  start_time: string;
  end_time: string;
  start_date?: string;
  end_date?: string;
}

export class UnifiedAvailabilityService {
  private static readonly DEFAULT_DURATION_MINUTES = 120;

  /**
   * Check if a specific time slot can accommodate a party size
   * Uses the same logic as TableAllocationService for consistency
   */
  static async checkTimeSlotAvailability(
    venueId: string,
    date: string,
    time: string,
    partySize: number,
    durationMinutes: number = this.DEFAULT_DURATION_MINUTES
  ): Promise<{
    available: boolean;
    reason?: string;
    suggestedTimes?: string[];
  }> {
    try {
      console.log(`🔍 Checking availability: ${date} ${time} for ${partySize} guests`);

      // Fetch all required data in parallel
      const [tablesResult, joinGroupsResult, bookingsResult, prioritiesResult] = await Promise.all([
        supabase.from('tables').select('*').eq('status', 'active').eq('venue_id', venueId),
        supabase.from('join_groups').select('*').eq('venue_id', venueId),
        supabase.from('bookings').select('*').eq('booking_date', date).eq('venue_id', venueId).neq('status', 'cancelled').neq('status', 'finished'),
        supabase.from('booking_priorities').select('*').eq('venue_id', venueId).eq('party_size', partySize).order('priority_rank')
      ]);

      const tables = tablesResult.data || [];
      const joinGroups = joinGroupsResult.data || [];
      const existingBookings = bookingsResult.data || [];
      const rawPriorities = prioritiesResult.data || [];

      // Filter and type-cast priorities
      const priorities: BookingPriority[] = rawPriorities
        .filter(p => p.item_type === 'table' || p.item_type === 'group')
        .map(p => ({
          id: p.id,
          party_size: p.party_size,
          item_type: p.item_type as 'table' | 'group',
          item_id: p.item_id,
          priority_rank: p.priority_rank
        }));

      // Get occupied table IDs for this time slot
      const occupiedTableIds = this.getOccupiedTableIds(existingBookings, time, durationMinutes);
      
      console.log(`🚫 Occupied tables at ${time}: [${occupiedTableIds.join(', ')}]`);

      // Try priority-based allocation first
      const priorityResult = this.tryPriorityBasedAllocation(
        priorities, tables, joinGroups, occupiedTableIds, partySize
      );

      if (priorityResult.available) {
        console.log(`✅ Available via priority allocation`);
        return { available: true };
      }

      // Try fallback allocation
      const fallbackResult = this.tryFallbackAllocation(
        tables, joinGroups, occupiedTableIds, partySize
      );

      if (fallbackResult.available) {
        console.log(`✅ Available via fallback allocation`);
        return { available: true };
      }

      // Generate alternative suggestions
      const suggestedTimes = await this.generateAlternativeTimeSlots(
        tables, joinGroups, existingBookings, date, time, partySize, durationMinutes
      );

      console.log(`❌ Not available at ${time}, ${suggestedTimes.length} alternatives found`);
      
      return {
        available: false,
        reason: `No tables available for ${partySize} guests at ${time}`,
        suggestedTimes
      };

    } catch (error) {
      console.error('❌ Availability check error:', error);
      return {
        available: false,
        reason: 'System error during availability check'
      };
    }
  }

  /**
   * Check if a date has any availability for a party size
   * Samples key time slots to determine overall date availability
   */
  static async checkDateAvailability(
    venueId: string,
    date: string,
    partySize: number,
    bookingWindows: BookingWindow[]
  ): Promise<boolean> {
    try {
      // Get time slots from booking windows
      const timeSlots = this.generateTimeSlots(date, bookingWindows);
      
      if (timeSlots.length === 0) {
        return false;
      }

      // Sample every 2 hours instead of every slot for performance
      const sampleSlots = timeSlots.filter((_, index) => index % 8 === 0); // Every 8th slot (2 hours if 15-min intervals)
      
      // Check if any sample slot is available
      for (const timeSlot of sampleSlots) {
        const result = await this.checkTimeSlotAvailability(venueId, date, timeSlot, partySize);
        if (result.available) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Date availability check error:', error);
      return false;
    }
  }

  /**
   * Pre-booking validation - final check before creating booking
   */
  static async validateBookingBeforeCreation(
    venueId: string,
    date: string,
    time: string,
    partySize: number,
    serviceId?: string
  ): Promise<{
    valid: boolean;
    reason?: string;
    alternatives?: string[];
  }> {
    console.log(`🛡️ Final validation for booking: ${date} ${time} (${partySize} guests)`);

    // Check if time is within booking windows
    if (serviceId) {
      const { data: bookingWindows } = await supabase
        .from('booking_windows')
        .select('*')
        .eq('service_id', serviceId);

      if (bookingWindows && !this.isTimeWithinBookingWindows(date, time, bookingWindows)) {
        return {
          valid: false,
          reason: 'Selected time is outside service hours'
        };
      }
    }

    // Use the same availability check as time slot checking
    const availabilityResult = await this.checkTimeSlotAvailability(venueId, date, time, partySize);
    
    return {
      valid: availabilityResult.available,
      reason: availabilityResult.reason,
      alternatives: availabilityResult.suggestedTimes
    };
  }

  private static tryPriorityBasedAllocation(
    priorities: BookingPriority[],
    tables: Table[],
    joinGroups: JoinGroup[],
    occupiedTableIds: number[],
    partySize: number
  ): { available: boolean } {
    
    for (const priority of priorities) {
      if (priority.item_type === 'table') {
        const table = tables.find(t => t.id === priority.item_id);
        if (table && !occupiedTableIds.includes(table.id) && table.seats >= partySize) {
          return { available: true };
        }
      } else if (priority.item_type === 'group') {
        const group = joinGroups.find(g => g.id === priority.item_id);
        if (group && this.isJoinGroupAvailable(group, occupiedTableIds, partySize)) {
          return { available: true };
        }
      }
    }

    return { available: false };
  }

  private static tryFallbackAllocation(
    tables: Table[],
    joinGroups: JoinGroup[],
    occupiedTableIds: number[],
    partySize: number
  ): { available: boolean } {
    
    // Try join groups for larger parties
    if (partySize >= 7) {
      for (const group of joinGroups) {
        if (this.isJoinGroupAvailable(group, occupiedTableIds, partySize)) {
          return { available: true };
        }
      }
    }

    // Try individual tables
    const availableTables = tables
      .filter(table => !occupiedTableIds.includes(table.id) && table.seats >= partySize);

    return { available: availableTables.length > 0 };
  }

  private static isJoinGroupAvailable(group: JoinGroup, occupiedTableIds: number[], partySize: number): boolean {
    return partySize >= group.min_party_size &&
           partySize <= group.max_party_size &&
           group.table_ids.every(tableId => !occupiedTableIds.includes(tableId));
  }

  private static getOccupiedTableIds(
    existingBookings: Booking[],
    newBookingTime: string,
    durationMinutes: number
  ): number[] {
    const newStart = this.parseTime(newBookingTime);
    const newEnd = addMinutes(newStart, durationMinutes);

    const occupiedIds: number[] = [];

    existingBookings.forEach(booking => {
      if (!booking.table_id) return;

      const bookingStart = this.parseTime(booking.booking_time);
      const bookingEnd = addMinutes(bookingStart, booking.duration_minutes || this.DEFAULT_DURATION_MINUTES);

      // Check if times overlap
      const hasOverlap = (
        (newStart >= bookingStart && newStart < bookingEnd) ||
        (newEnd > bookingStart && newEnd <= bookingEnd) ||
        (newStart <= bookingStart && newEnd >= bookingEnd)
      );

      if (hasOverlap) {
        occupiedIds.push(booking.table_id);
      }
    });

    return occupiedIds;
  }

  private static parseTime(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private static generateTimeSlots(date: string, bookingWindows: BookingWindow[]): string[] {
    const dayName = format(new Date(date), 'EEE').toLowerCase();
    
    const activeWindows = bookingWindows.filter(window => 
      window.days.includes(dayName) &&
      (!window.start_date || date >= window.start_date) &&
      (!window.end_date || date <= window.end_date)
    );

    if (activeWindows.length === 0) return [];

    const timeSlots: string[] = [];
    
    for (const window of activeWindows) {
      const startHour = parseInt(window.start_time.split(':')[0]);
      const endHour = parseInt(window.end_time.split(':')[0]);
      
      for (let hour = startHour; hour <= endHour; hour++) {
        for (let minute of [0, 15, 30, 45]) {
          const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          timeSlots.push(timeSlot);
        }
      }
    }

    return timeSlots;
  }

  private static isTimeWithinBookingWindows(date: string, time: string, bookingWindows: any[]): boolean {
    const dayName = format(new Date(date), 'EEE').toLowerCase();
    
    return bookingWindows.some(window => {
      if (!window.days.includes(dayName)) return false;
      if (window.start_date && date < window.start_date) return false;
      if (window.end_date && date > window.end_date) return false;
      
      return time >= window.start_time && time <= window.end_time;
    });
  }

  private static async generateAlternativeTimeSlots(
    tables: Table[],
    joinGroups: JoinGroup[],
    existingBookings: Booking[],
    date: string,
    requestedTime: string,
    partySize: number,
    durationMinutes: number
  ): Promise<string[]> {
    
    const alternatives: string[] = [];
    const [requestedHours, requestedMinutes] = requestedTime.split(':').map(Number);
    
    // Check slots ±2 hours from requested time in 30-minute intervals
    for (let hourOffset = -2; hourOffset <= 2; hourOffset++) {
      for (let minuteOffset of [0, 30]) {
        if (hourOffset === 0 && minuteOffset === 0) continue; // Skip requested time
        
        const checkHours = requestedHours + hourOffset;
        const checkMinutes = requestedMinutes + minuteOffset;
        
        if (checkHours < 17 || checkHours > 22 || checkMinutes >= 60) continue;
        
        const timeSlot = `${checkHours.toString().padStart(2, '0')}:${(checkMinutes % 60).toString().padStart(2, '0')}`;
        const occupiedIds = this.getOccupiedTableIds(existingBookings, timeSlot, durationMinutes);
        
        // Check if this time slot would be available
        const priorityResult = this.tryPriorityBasedAllocation([], tables, joinGroups, occupiedIds, partySize);
        const fallbackResult = this.tryFallbackAllocation(tables, joinGroups, occupiedIds, partySize);
        
        if (priorityResult.available || fallbackResult.available) {
          alternatives.push(timeSlot);
        }
      }
    }
    
    return alternatives.slice(0, 3); // Return top 3 alternatives
  }
}
