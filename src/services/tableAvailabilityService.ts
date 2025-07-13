
import { supabase } from "@/integrations/supabase/client";
import { addMinutes, parseISO, format } from "date-fns";

interface Table {
  id: number;
  label: string;
  seats: number;
  section_id: number;
  join_groups: number[];
  priority_rank: number;
  venue_id: string;
}

interface JoinGroup {
  id: number;
  name: string;
  table_ids: number[];
  min_party_size: number;
  max_party_size: number;
}

interface BookingPriority {
  id: number;
  party_size: number;
  item_type: 'table' | 'group';
  item_id: number;
  priority_rank: number;
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

interface AlternativeTimeSlot {
  time: string;
  availableTables: number;
  suggestedTable?: Table;
  reason: string;
}

export class TableAvailabilityService {
  private static readonly DEFAULT_DURATION_MINUTES = 120;

  static async getEnhancedTableAllocation(
    partySize: number,
    bookingDate: string,
    bookingTime: string,
    venueId: string,
    durationMinutes: number = this.DEFAULT_DURATION_MINUTES
  ): Promise<{
    success: boolean;
    tableIds: number[] | null;
    alternatives?: AlternativeTimeSlot[];
    reason?: string;
  }> {
    try {
      console.log(`🎯 Enhanced allocation for party of ${partySize} on ${bookingDate} at ${bookingTime}`);

      // Fetch all data in parallel
      const [tablesResult, joinGroupsResult, bookingsResult, prioritiesResult] = await Promise.all([
        supabase.from('tables').select('*').eq('status', 'active').eq('venue_id', venueId),
        supabase.from('join_groups').select('*').eq('venue_id', venueId),
        supabase.from('bookings').select('*').eq('booking_date', bookingDate).eq('venue_id', venueId).neq('status', 'cancelled').neq('status', 'finished'),
        supabase.from('booking_priorities').select('*').eq('venue_id', venueId).eq('party_size', partySize).order('priority_rank')
      ]);

      const tables = tablesResult.data || [];
      const joinGroups = joinGroupsResult.data || [];
      const existingBookings = bookingsResult.data || [];
      const priorities = prioritiesResult.data || [];

      console.log(`📊 Found ${tables.length} tables, ${joinGroups.length} join groups, ${existingBookings.length} bookings, ${priorities.length} priorities`);

      // Get occupied table IDs
      const occupiedTableIds = this.getOccupiedTableIds(existingBookings, bookingTime, durationMinutes);
      console.log(`🚫 Occupied tables: [${occupiedTableIds.join(', ')}]`);

      // Try priority-based allocation
      const priorityResult = await this.tryPriorityBasedAllocation(
        priorities, tables, joinGroups, occupiedTableIds, partySize
      );

      if (priorityResult.success) {
        return priorityResult;
      }

      // Try fallback allocation
      const fallbackResult = await this.tryFallbackAllocation(
        tables, joinGroups, occupiedTableIds, partySize
      );

      if (fallbackResult.success) {
        return fallbackResult;
      }

      // Generate alternative time suggestions
      const alternatives = await this.generateAlternativeTimeSlots(
        tables, existingBookings, bookingDate, bookingTime, partySize, durationMinutes
      );

      return {
        success: false,
        tableIds: null,
        alternatives,
        reason: `No tables available for ${partySize} guests at ${bookingTime}`
      };

    } catch (error) {
      console.error('❌ Enhanced allocation error:', error);
      return {
        success: false,
        tableIds: null,
        reason: 'System error during table allocation'
      };
    }
  }

  private static async tryPriorityBasedAllocation(
    priorities: BookingPriority[],
    tables: Table[],
    joinGroups: JoinGroup[],
    occupiedTableIds: number[],
    partySize: number
  ): Promise<{ success: boolean; tableIds: number[] | null }> {
    
    for (const priority of priorities) {
      if (priority.item_type === 'table') {
        const table = tables.find(t => t.id === priority.item_id);
        if (table && !occupiedTableIds.includes(table.id) && table.seats >= partySize) {
          console.log(`✅ Priority table allocation: ${table.label} (priority: ${priority.priority_rank})`);
          return { success: true, tableIds: [table.id] };
        }
      } else if (priority.item_type === 'group') {
        const group = joinGroups.find(g => g.id === priority.item_id);
        if (group && this.isJoinGroupAvailable(group, occupiedTableIds, partySize)) {
          console.log(`✅ Priority group allocation: ${group.name} (priority: ${priority.priority_rank})`);
          return { success: true, tableIds: group.table_ids };
        }
      }
    }

    return { success: false, tableIds: null };
  }

  private static async tryFallbackAllocation(
    tables: Table[],
    joinGroups: JoinGroup[],
    occupiedTableIds: number[],
    partySize: number
  ): Promise<{ success: boolean; tableIds: number[] | null }> {
    
    // Try join groups for larger parties
    if (partySize >= 7) {
      for (const group of joinGroups) {
        if (this.isJoinGroupAvailable(group, occupiedTableIds, partySize)) {
          console.log(`✅ Fallback group allocation: ${group.name}`);
          return { success: true, tableIds: group.table_ids };
        }
      }
    }

    // Try individual tables sorted by efficiency (closest to party size first)
    const availableTables = tables
      .filter(table => !occupiedTableIds.includes(table.id) && table.seats >= partySize)
      .sort((a, b) => {
        const efficiencyA = partySize / a.seats; // Higher is better
        const efficiencyB = partySize / b.seats;
        return efficiencyB - efficiencyA || a.priority_rank - b.priority_rank;
      });

    if (availableTables.length > 0) {
      const selectedTable = availableTables[0];
      console.log(`✅ Fallback table allocation: ${selectedTable.label} (efficiency: ${(partySize/selectedTable.seats*100).toFixed(1)}%)`);
      return { success: true, tableIds: [selectedTable.id] };
    }

    return { success: false, tableIds: null };
  }

  private static isJoinGroupAvailable(group: JoinGroup, occupiedTableIds: number[], partySize: number): boolean {
    return partySize >= group.min_party_size &&
           partySize <= group.max_party_size &&
           group.table_ids.every(tableId => !occupiedTableIds.includes(tableId));
  }

  private static async generateAlternativeTimeSlots(
    tables: Table[],
    existingBookings: Booking[],
    bookingDate: string,
    requestedTime: string,
    partySize: number,
    durationMinutes: number
  ): Promise<AlternativeTimeSlot[]> {
    
    const alternatives: AlternativeTimeSlot[] = [];
    const [requestedHours, requestedMinutes] = requestedTime.split(':').map(Number);
    
    // Check slots ±2 hours from requested time in 30-minute intervals
    for (let hourOffset = -2; hourOffset <= 2; hourOffset++) {
      for (let minuteOffset of [0, 30]) {
        if (hourOffset === 0 && minuteOffset === 0) continue; // Skip requested time
        
        const checkHours = requestedHours + hourOffset;
        const checkMinutes = requestedMinutes + minuteOffset;
        
        if (checkHours < 17 || checkHours > 22 || checkMinutes >= 60) continue; // Business hours check
        
        const timeSlot = `${checkHours.toString().padStart(2, '0')}:${(checkMinutes % 60).toString().padStart(2, '0')}`;
        const occupiedIds = this.getOccupiedTableIds(existingBookings, timeSlot, durationMinutes);
        
        const availableTables = tables.filter(t => 
          !occupiedIds.includes(t.id) && t.seats >= partySize
        );
        
        if (availableTables.length > 0) {
          const bestTable = availableTables.sort((a, b) => {
            const effA = partySize / a.seats;
            const effB = partySize / b.seats;
            return effB - effA || a.priority_rank - b.priority_rank;
          })[0];
          
          alternatives.push({
            time: timeSlot,
            availableTables: availableTables.length,
            suggestedTable: bestTable,
            reason: hourOffset === 0 ? 'Same day alternative' : 
                   Math.abs(hourOffset) === 1 ? 'Close time alternative' : 'Available alternative'
          });
        }
      }
    }
    
    return alternatives.slice(0, 5); // Return top 5 alternatives
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

  static async getRealTimeAvailability(
    venueId: string,
    date: string,
    startTime: string,
    endTime: string,
    partySize: number
  ): Promise<{ [time: string]: { available: boolean; tableCount: number } }> {
    try {
      const [tablesResult, bookingsResult] = await Promise.all([
        supabase.from('tables').select('*').eq('status', 'active').eq('venue_id', venueId),
        supabase.from('bookings').select('*').eq('booking_date', date).eq('venue_id', venueId).neq('status', 'cancelled').neq('status', 'finished')
      ]);

      const tables = tablesResult.data || [];
      const bookings = bookingsResult.data || [];
      const availability: { [time: string]: { available: boolean; tableCount: number } } = {};

      // Generate 30-minute time slots
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      for (let hour = startHours; hour <= endHours; hour++) {
        for (let minute of [0, 30]) {
          if (hour === endHours && minute > endMinutes) break;
          if (hour === startHours && minute < startMinutes) continue;
          
          const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const occupiedIds = this.getOccupiedTableIds(bookings, timeSlot, this.DEFAULT_DURATION_MINUTES);
          const availableTables = tables.filter(t => !occupiedIds.includes(t.id) && t.seats >= partySize);
          
          availability[timeSlot] = {
            available: availableTables.length > 0,
            tableCount: availableTables.length
          };
        }
      }

      return availability;
    } catch (error) {
      console.error('Error getting real-time availability:', error);
      return {};
    }
  }
}
