
import { supabase } from "@/integrations/supabase/client";

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
}

export class TableAllocationService {
  static async allocateTable(partySize: number, bookingDate: string, bookingTime: string): Promise<number[] | null> {
    try {
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

      // Fetch existing bookings for the same date and time
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', bookingDate)
        .eq('booking_time', bookingTime)
        .neq('status', 'cancelled');

      if (!tables || !joinGroups || !existingBookings) {
        throw new Error('Failed to fetch required data');
      }

      const occupiedTableIds = existingBookings
        .filter(booking => booking.table_id)
        .map(booking => booking.table_id);

      // Try to allocate using join groups first for larger parties
      if (partySize >= 7) {
        const suitableGroup = joinGroups.find(group => 
          partySize >= group.min_party_size && 
          partySize <= group.max_party_size &&
          group.table_ids.every(tableId => !occupiedTableIds.includes(tableId))
        );

        if (suitableGroup) {
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
        return [availableTables[0].id];
      }

      return null; // No suitable allocation found
    } catch (error) {
      console.error('Table allocation error:', error);
      return null;
    }
  }

  static async allocateBookingToTables(bookingId: number, partySize: number, bookingDate: string, bookingTime: string): Promise<boolean> {
    const tableIds = await this.allocateTable(partySize, bookingDate, bookingTime);
    
    if (!tableIds || tableIds.length === 0) {
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

    // Allocate to first table (primary table)
    await supabase
      .from('bookings')
      .update({ 
        table_id: tableIds[0],
        is_unallocated: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    return true;
  }
}
