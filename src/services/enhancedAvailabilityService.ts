import { supabase } from "@/integrations/supabase/client";
import { TableAllocationService } from "./tableAllocation";

export class EnhancedAvailabilityService {
  /**
   * Check availability with improved join group logic for large parties
   */
  static async checkAvailabilityWithJoinGroups(
    venueId: string,
    date: string,
    startTime: string,
    endTime: string,
    partySize: number,
    durationMinutes: number = 120
  ): Promise<{ [time: string]: { available: boolean; reason?: string; suggestedTables?: string[] } }> {
    try {
      console.log(`🔍 Enhanced availability check for party of ${partySize} from ${startTime} to ${endTime}`);

      // Fetch all data we need
      const [tablesResult, joinGroupsResult, bookingsResult] = await Promise.all([
        supabase.from('tables').select('*').eq('status', 'active').eq('venue_id', venueId),
        supabase.from('join_groups').select('*').eq('venue_id', venueId),
        supabase.from('bookings').select('*').eq('booking_date', date).eq('venue_id', venueId).neq('status', 'cancelled').neq('status', 'finished')
      ]);

      const tables = tablesResult.data || [];
      const joinGroups = joinGroupsResult.data || [];
      const existingBookings = bookingsResult.data || [];

      console.log(`📊 Found ${tables.length} tables, ${joinGroups.length} join groups`);
      console.log(`🔗 Join groups:`, joinGroups.map(g => `${g.name} (${g.min_party_size}-${g.max_party_size} people, tables: [${g.table_ids.join(',')}])`));

      const availability: { [time: string]: { available: boolean; reason?: string; suggestedTables?: string[] } } = {};

      // Generate 15-minute time slots
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      for (let hour = startHours; hour <= endHours; hour++) {
        for (let minute of [0, 15, 30, 45]) {
          if (hour === endHours && minute > endMinutes) break;
          if (hour === startHours && minute < startMinutes) continue;
          
          const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // Get occupied table IDs for this time slot
          const occupiedTableIds = this.getOccupiedTableIds(existingBookings, timeSlot, durationMinutes);
          
          console.log(`⏰ Checking ${timeSlot} - occupied tables: [${occupiedTableIds.join(',')}]`);
          
          // Check if any join groups can accommodate the party
          const availableJoinGroups = joinGroups.filter(group => 
            partySize >= group.min_party_size &&
            partySize <= group.max_party_size &&
            group.table_ids.every((tableId: number) => !occupiedTableIds.includes(tableId))
          );

          // Check individual tables
          const availableTables = tables.filter(table => 
            !occupiedTableIds.includes(table.id) &&
            table.seats >= partySize
          );

          const hasAvailability = availableJoinGroups.length > 0 || availableTables.length > 0;
          
          let suggestedTables: string[] = [];
          let reason = '';
          
          if (availableJoinGroups.length > 0) {
            suggestedTables = availableJoinGroups.map(g => g.name);
            reason = `Available via join groups: ${suggestedTables.join(', ')}`;
          } else if (availableTables.length > 0) {
            suggestedTables = availableTables.map(t => t.label);
            reason = `Available individual tables: ${suggestedTables.join(', ')}`;
          } else {
            reason = `No suitable tables for ${partySize} guests`;
          }
          
          console.log(`   ${hasAvailability ? '✅' : '❌'} ${timeSlot}: ${reason}`);
          
          availability[timeSlot] = {
            available: hasAvailability,
            reason,
            suggestedTables: hasAvailability ? suggestedTables : undefined
          };
        }
      }

      return availability;
    } catch (error) {
      console.error('❌ Error checking enhanced availability:', error);
      return {};
    }
  }

  private static getOccupiedTableIds(
    existingBookings: any[],
    newBookingTime: string,
    durationMinutes: number
  ): number[] {
    const newStart = this.parseTime(newBookingTime);
    const newEnd = new Date(newStart.getTime() + (durationMinutes * 60 * 1000));

    const occupiedIds: number[] = [];

    existingBookings.forEach(booking => {
      if (!booking.table_id) return;

      const bookingStart = this.parseTime(booking.booking_time);
      const bookingEnd = new Date(bookingStart.getTime() + ((booking.duration_minutes || 120) * 60 * 1000));

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
}