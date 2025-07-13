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

interface DetailedAvailabilityResult {
  available: boolean;
  reason?: string;
  suggestedTimes?: string[];
  debugInfo?: {
    totalTables: number;
    suitableTables: number;
    occupiedTableIds: number[];
    availableTableIds: number[];
    joinGroupsConsidered: number;
    prioritiesConsidered: number;
  };
}

export class UnifiedAvailabilityService {
  private static readonly DEFAULT_DURATION_MINUTES = 120;

  /**
   * Enhanced availability check with detailed debugging information
   */
  static async checkTimeSlotAvailability(
    venueId: string,
    date: string,
    time: string,
    partySize: number,
    durationMinutes: number = this.DEFAULT_DURATION_MINUTES
  ): Promise<DetailedAvailabilityResult> {
    try {
      console.log(`🔍 DETAILED CHECK: ${date} ${time} for ${partySize} guests`);

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

      console.log(`📊 Data fetched: ${tables.length} tables, ${joinGroups.length} groups, ${existingBookings.length} bookings`);

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

      // Get occupied table IDs for this exact time slot
      const occupiedTableIds = this.getOccupiedTableIds(existingBookings, time, durationMinutes);
      
      console.log(`🚫 Occupied tables at ${time}:`, {
        occupiedIds: occupiedTableIds,
        existingBookings: existingBookings.map(b => ({
          id: b.id,
          guest_name: b.guest_name,
          table_id: b.table_id,
          booking_time: b.booking_time,
          party_size: b.party_size
        }))
      });

      // Find suitable tables (can accommodate party size)
      const suitableTables = tables.filter(table => table.seats >= partySize);
      const availableTableIds = suitableTables
        .filter(table => !occupiedTableIds.includes(table.id))
        .map(table => table.id);

      console.log(`🎯 Table analysis:`, {
        totalTables: tables.length,
        suitableTables: suitableTables.length,
        availableSuitableTables: availableTableIds.length,
        suitableTableDetails: suitableTables.map(t => ({ 
          id: t.id, 
          label: t.label, 
          seats: t.seats, 
          occupied: occupiedTableIds.includes(t.id) 
        }))
      });

      const debugInfo = {
        totalTables: tables.length,
        suitableTables: suitableTables.length,
        occupiedTableIds,
        availableTableIds,
        joinGroupsConsidered: joinGroups.length,
        prioritiesConsidered: priorities.length
      };

      // Try priority-based allocation first
      const priorityResult = this.tryPriorityBasedAllocation(
        priorities, tables, joinGroups, occupiedTableIds, partySize
      );

      if (priorityResult.available) {
        console.log(`✅ Available via priority allocation`);
        return { available: true, debugInfo };
      }

      // Try join groups for larger parties (≥7 people)
      if (partySize >= 7) {
        console.log(`🔗 Checking join groups for party of ${partySize}`);
        
        for (const group of joinGroups) {
          console.log(`  Checking group "${group.name}":`, {
            tableIds: group.table_ids,
            minParty: group.min_party_size,
            maxParty: group.max_party_size,
            partySizeCheck: partySize >= group.min_party_size && partySize <= group.max_party_size
          });

          if (this.isJoinGroupAvailable(group, occupiedTableIds, partySize)) {
            console.log(`✅ Available via join group: ${group.name}`);
            return { available: true, debugInfo };
          } else {
            // Log why this join group wasn't available
            const conflictingTables = group.table_ids.filter(tableId => occupiedTableIds.includes(tableId));
            console.log(`  ❌ Group "${group.name}" unavailable:`, {
              conflictingTables,
              partySizeInRange: partySize >= group.min_party_size && partySize <= group.max_party_size
            });
          }
        }
      }

      // Try individual tables as fallback
      const availableTables = tables
        .filter(table => !occupiedTableIds.includes(table.id) && table.seats >= partySize);

      if (availableTables.length > 0) {
        console.log(`✅ Available via individual tables:`, availableTables.map(t => t.label));
        return { available: true, debugInfo };
      }

      // Generate alternative suggestions
      const suggestedTimes = await this.generateAlternativeTimeSlots(
        tables, joinGroups, existingBookings, date, time, partySize, durationMinutes
      );

      console.log(`❌ NOT AVAILABLE at ${time}:`, {
        reason: `No tables available for ${partySize} guests`,
        suggestedAlternatives: suggestedTimes.length
      });
      
      return {
        available: false,
        reason: `No tables available for ${partySize} guests at ${time}`,
        suggestedTimes,
        debugInfo
      };

    } catch (error) {
      console.error('❌ Availability check error:', error);
      return {
        available: false,
        reason: 'System error during availability check',
        debugInfo: {
          totalTables: 0,
          suitableTables: 0,
          occupiedTableIds: [],
          availableTableIds: [],
          joinGroupsConsidered: 0,
          prioritiesConsidered: 0
        }
      };
    }
  }

  /**
   * Pre-booking validation with race condition protection
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
    debugInfo?: any;
  }> {
    console.log(`🛡️ FINAL VALIDATION for booking: ${date} ${time} (${partySize} guests)`);

    // Check if time is within booking windows
    if (serviceId) {
      const { data: bookingWindows } = await supabase
        .from('booking_windows')
        .select('*')
        .eq('service_id', serviceId);

      if (bookingWindows && !this.isTimeWithinBookingWindows(date, time, bookingWindows)) {
        console.log(`❌ Time ${time} is outside service hours`);
        return {
          valid: false,
          reason: 'Selected time is outside service hours'
        };
      }
    }

    // CRITICAL: Re-fetch the latest booking data to avoid race conditions
    console.log(`🔄 Re-fetching latest booking data to prevent race conditions...`);
    const { data: latestBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_date', date)
      .eq('venue_id', venueId)
      .neq('status', 'cancelled')
      .neq('status', 'finished');

    console.log(`📊 Latest bookings count: ${latestBookings?.length || 0}`);

    // Use the same availability check but with the freshest data
    const availabilityResult = await this.checkTimeSlotAvailabilityWithBookings(
      venueId, date, time, partySize, latestBookings || []
    );
    
    console.log(`🎯 Final validation result:`, {
      valid: availabilityResult.available,
      reason: availabilityResult.reason,
      debugInfo: availabilityResult.debugInfo
    });

    return {
      valid: availabilityResult.available,
      reason: availabilityResult.reason,
      alternatives: availabilityResult.suggestedTimes,
      debugInfo: availabilityResult.debugInfo
    };
  }

  /**
   * Internal method to check availability with provided booking data
   */
  private static async checkTimeSlotAvailabilityWithBookings(
    venueId: string,
    date: string,
    time: string,
    partySize: number,
    existingBookings: any[]
  ): Promise<DetailedAvailabilityResult> {
    
    // Fetch tables and groups (these change less frequently)
    const [tablesResult, joinGroupsResult, prioritiesResult] = await Promise.all([
      supabase.from('tables').select('*').eq('status', 'active').eq('venue_id', venueId),
      supabase.from('join_groups').select('*').eq('venue_id', venueId),
      supabase.from('booking_priorities').select('*').eq('venue_id', venueId).eq('party_size', partySize).order('priority_rank')
    ]);

    const tables = tablesResult.data || [];
    const joinGroups = joinGroupsResult.data || [];
    const rawPriorities = prioritiesResult.data || [];

    const priorities: BookingPriority[] = rawPriorities
      .filter(p => p.item_type === 'table' || p.item_type === 'group')
      .map(p => ({
        id: p.id,
        party_size: p.party_size,
        item_type: p.item_type as 'table' | 'group',
        item_id: p.item_id,
        priority_rank: p.priority_rank
      }));

    const occupiedTableIds = this.getOccupiedTableIds(existingBookings, time, this.DEFAULT_DURATION_MINUTES);
    
    console.log(`🔍 Using fresh booking data:`, {
      bookingsCount: existingBookings.length,
      occupiedTableIds,
      bookingDetails: existingBookings.map(b => ({
        guest: b.guest_name,
        table: b.table_id,
        time: b.booking_time,
        party: b.party_size
      }))
    });

    const debugInfo = {
      totalTables: tables.length,
      suitableTables: tables.filter(t => t.seats >= partySize).length,
      occupiedTableIds,
      availableTableIds: tables.filter(t => !occupiedTableIds.includes(t.id) && t.seats >= partySize).map(t => t.id),
      joinGroupsConsidered: joinGroups.length,
      prioritiesConsidered: priorities.length
    };

    // Try priority-based allocation
    const priorityResult = this.tryPriorityBasedAllocation(
      priorities, tables, joinGroups, occupiedTableIds, partySize
    );

    if (priorityResult.available) {
      return { available: true, debugInfo };
    }

    // Try join groups for larger parties
    if (partySize >= 7) {
      for (const group of joinGroups) {
        if (this.isJoinGroupAvailable(group, occupiedTableIds, partySize)) {
          return { available: true, debugInfo };
        }
      }
    }

    // Try individual tables
    const availableTables = tables
      .filter(table => !occupiedTableIds.includes(table.id) && table.seats >= partySize);

    if (availableTables.length > 0) {
      return { available: true, debugInfo };
    }

    return {
      available: false,
      reason: `No tables available for ${partySize} guests at ${time}`,
      debugInfo
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
    const isPartySizeOk = partySize >= group.min_party_size && partySize <= group.max_party_size;
    const areTablesAvailable = group.table_ids.every(tableId => !occupiedTableIds.includes(tableId));
    
    console.log(`  Join group "${group.name}" check:`, {
      partySizeOk: isPartySizeOk,
      tablesAvailable: areTablesAvailable,
      requiredTables: group.table_ids,
      conflictingTables: group.table_ids.filter(id => occupiedTableIds.includes(id))
    });
    
    return isPartySizeOk && areTablesAvailable;
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
        
        // Try join groups for larger parties
        let joinGroupAvailable = false;
        if (partySize >= 7) {
          for (const group of joinGroups) {
            if (this.isJoinGroupAvailable(group, occupiedIds, partySize)) {
              joinGroupAvailable = true;
              break;
            }
          }
        }
        
        // Try individual tables
        const individualTablesAvailable = tables
          .filter(table => !occupiedIds.includes(table.id) && table.seats >= partySize).length > 0;
        
        if (priorityResult.available || joinGroupAvailable || individualTablesAvailable) {
          alternatives.push(timeSlot);
        }
      }
    }
    
    return alternatives.slice(0, 3); // Return top 3 alternatives
  }

  /**
   * Legacy method for backward compatibility
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

      // Sample every 4th slot for performance (every hour if 15-min intervals)
      const sampleSlots = timeSlots.filter((_, index) => index % 4 === 0);
      
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
}
