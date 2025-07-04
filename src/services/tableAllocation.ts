
import { supabase } from "@/integrations/supabase/client";
import { addMinutes, parseISO, format } from "date-fns";

interface Table {
  id: number;
  label: string;
  seats: number;
  section_id: number;
  join_groups: number[];
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

export class TableAllocationService {
  private static readonly DEFAULT_DURATION_MINUTES = 120; // 2 hours default

  static async allocateTable(
    partySize: number, 
    bookingDate: string, 
    bookingTime: string,
    durationMinutes: number = this.DEFAULT_DURATION_MINUTES
  ): Promise<number[] | null> {
    try {
      console.log(`Allocating table for party of ${partySize} on ${bookingDate} at ${bookingTime}`);

      // Fetch all active tables
      const { data: tables } = await supabase
        .from('tables')
        .select('*')
        .eq('status', 'active')
        .order('priority_rank');

      // Fetch join groups
      const { data: joinGroups } = await supabase
        .from('join_groups')
        .select('*');

      // Fetch existing bookings for the same date
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', bookingDate)
        .neq('status', 'cancelled')
        .neq('status', 'finished');

      if (!tables || !existingBookings) {
        throw new Error('Failed to fetch required data');
      }

      // Check which tables are occupied during the requested time
      const occupiedTableIds = this.getOccupiedTableIds(
        existingBookings,
        bookingTime,
        durationMinutes
      );

      console.log(`Occupied tables during ${bookingTime}: ${occupiedTableIds.join(', ')}`);

      // Try join groups first for larger parties (7+)
      if (partySize >= 7 && joinGroups) {
        const suitableGroup = joinGroups.find(group => 
          partySize >= group.min_party_size && 
          partySize <= group.max_party_size &&
          group.table_ids.every(tableId => !occupiedTableIds.includes(tableId))
        );

        if (suitableGroup) {
          console.log(`Allocated join group ${suitableGroup.name} for party of ${partySize}`);
          return suitableGroup.table_ids;
        }
      }

      // Try single table allocation
      const availableTables = tables.filter(table => 
        !occupiedTableIds.includes(table.id) &&
        table.seats >= partySize
      );

      if (availableTables.length > 0) {
        // Sort by seat count (prefer tables closer to party size)
        availableTables.sort((a, b) => a.seats - b.seats);
        console.log(`Allocated table ${availableTables[0].label} for party of ${partySize}`);
        return [availableTables[0].id];
      }

      console.log(`No suitable allocation found for party of ${partySize}`);
      return null;
    } catch (error) {
      console.error('Table allocation error:', error);
      return null;
    }
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

  static async allocateBookingToTables(
    bookingId: number, 
    partySize: number, 
    bookingDate: string, 
    bookingTime: string
  ): Promise<boolean> {
    console.log(`Attempting to allocate booking ${bookingId}`);
    
    const tableIds = await this.allocateTable(partySize, bookingDate, bookingTime);
    
    if (!tableIds || tableIds.length === 0) {
      console.log(`No tables available, marking booking ${bookingId} as unallocated`);
      // Mark as unallocated
      await supabase
        .from('bookings')
        .update({ 
          is_unallocated: true,
          table_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);
      return false;
    }

    console.log(`Allocating booking ${bookingId} to table ${tableIds[0]}`);
    // Allocate to primary table
    const { error } = await supabase
      .from('bookings')
      .update({ 
        table_id: tableIds[0],
        is_unallocated: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) {
      console.error('Error updating booking:', error);
      return false;
    }

    return true;
  }

  static async manuallyAssignBookingToTable(
    bookingId: number,
    tableId: number
  ): Promise<boolean> {
    try {
      console.log(`Manually assigning booking ${bookingId} to table ${tableId}`);
      
      const { error } = await supabase
        .from('bookings')
        .update({ 
          table_id: tableId,
          is_unallocated: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;
      
      console.log(`Successfully assigned booking ${bookingId} to table ${tableId}`);
      return true;
    } catch (error) {
      console.error('Manual assignment error:', error);
      return false;
    }
  }

  static async getAvailableTablesForBooking(
    partySize: number,
    bookingDate: string,
    bookingTime: string
  ): Promise<Table[]> {
    try {
      // Fetch all active tables
      const { data: tables } = await supabase
        .from('tables')
        .select('*')
        .eq('status', 'active')
        .order('priority_rank');

      // Fetch existing bookings for the same date
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', bookingDate)
        .neq('status', 'cancelled')
        .neq('status', 'finished');

      if (!tables || !existingBookings) {
        return [];
      }

      const occupiedTableIds = this.getOccupiedTableIds(
        existingBookings,
        bookingTime,
        this.DEFAULT_DURATION_MINUTES
      );

      return tables.filter(table => 
        !occupiedTableIds.includes(table.id) &&
        table.seats >= partySize
      );
    } catch (error) {
      console.error('Error getting available tables:', error);
      return [];
    }
  }
}
