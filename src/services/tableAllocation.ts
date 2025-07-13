import { supabase } from "@/integrations/supabase/client";
import { UnifiedAvailabilityService } from "./unifiedAvailabilityService";

export class TableAllocationService {
  private static readonly DEFAULT_DURATION_MINUTES = 120;

  static async allocateTable(
    partySize: number, 
    bookingDate: string, 
    bookingTime: string,
    durationMinutes: number = this.DEFAULT_DURATION_MINUTES,
    venueId?: string
  ): Promise<{
    tableIds: number[] | null;
    alternatives?: any[];
    reason?: string;
  }> {
    try {
      console.log(`🎯 Allocating table for party of ${partySize} on ${bookingDate} at ${bookingTime}`);

      // If no venueId provided, get the first approved venue (for public bookings)
      let targetVenueId = venueId;
      if (!targetVenueId) {
        const { data: venue } = await supabase
          .from('venues')
          .select('id')
          .eq('approval_status', 'approved')
          .limit(1)
          .single();
        
        if (!venue) {
          throw new Error('No approved venue found');
        }
        targetVenueId = venue.id;
      }

      // Use unified availability service for consistency
      const availabilityResult = await UnifiedAvailabilityService.checkTimeSlotAvailability(
        targetVenueId,
        bookingDate,
        bookingTime,
        partySize,
        durationMinutes
      );

      if (availabilityResult.available) {
        // If available, run the full allocation to get specific table IDs
        const result = await this.performActualAllocation(
          partySize,
          bookingDate,
          bookingTime,
          targetVenueId,
          durationMinutes
        );

        if (result.success) {
          console.log(`✅ Allocation successful: tables [${result.tableIds?.join(', ')}]`);
          return { tableIds: result.tableIds };
        }
      }

      console.log(`❌ No tables available, found ${availabilityResult.suggestedTimes?.length || 0} alternatives`);
      return {
        tableIds: null,
        alternatives: availabilityResult.suggestedTimes?.map(time => ({ time })) || [],
        reason: availabilityResult.reason
      };

    } catch (error) {
      console.error('❌ Table allocation error:', error);
      return {
        tableIds: null,
        reason: 'System error during allocation'
      };
    }
  }

  private static async performActualAllocation(
    partySize: number,
    bookingDate: string,
    bookingTime: string,
    venueId: string,
    durationMinutes: number
  ): Promise<{
    success: boolean;
    tableIds: number[] | null;
  }> {
    // Fetch all data needed for allocation
    const [tablesResult, joinGroupsResult, bookingsResult, prioritiesResult] = await Promise.all([
      supabase.from('tables').select('*').eq('status', 'active').eq('venue_id', venueId).order('priority_rank'),
      supabase.from('join_groups').select('*').eq('venue_id', venueId),
      supabase.from('bookings').select('*').eq('booking_date', bookingDate).eq('venue_id', venueId).neq('status', 'cancelled').neq('status', 'finished'),
      supabase.from('booking_priorities').select('*').eq('venue_id', venueId).eq('party_size', partySize).order('priority_rank')
    ]);

    const tables = tablesResult.data || [];
    const joinGroups = joinGroupsResult.data || [];
    const existingBookings = bookingsResult.data || [];
    const rawPriorities = prioritiesResult.data || [];

    // Filter priorities
    const priorities = rawPriorities
      .filter(p => p.item_type === 'table' || p.item_type === 'group')
      .map(p => ({
        id: p.id,
        party_size: p.party_size,
        item_type: p.item_type as 'table' | 'group',
        item_id: p.item_id,
        priority_rank: p.priority_rank
      }));

    // Get occupied table IDs
    const occupiedTableIds = this.getOccupiedTableIds(existingBookings, bookingTime, durationMinutes);

    // Try priority-based allocation
    for (const priority of priorities) {
      if (priority.item_type === 'table') {
        const table = tables.find(t => t.id === priority.item_id);
        if (table && !occupiedTableIds.includes(table.id) && table.seats >= partySize) {
          return { success: true, tableIds: [table.id] };
        }
      } else if (priority.item_type === 'group') {
        const group = joinGroups.find(g => g.id === priority.item_id);
        if (group && this.isJoinGroupAvailable(group, occupiedTableIds, partySize)) {
          return { success: true, tableIds: group.table_ids };
        }
      }
    }

    // Try fallback allocation - join groups for larger parties first, then any size
    console.log(`🔄 Trying fallback allocation for party of ${partySize}`);
    
    // First try join groups (for any party size that could benefit)
    for (const group of joinGroups) {
      if (this.isJoinGroupAvailable(group, occupiedTableIds, partySize)) {
        console.log(`✅ Fallback group allocation: ${group.name} (tables: [${group.table_ids.join(', ')}])`);
        return { success: true, tableIds: group.table_ids };
      }
    }

    // Try individual tables
    const availableTables = tables
      .filter(table => !occupiedTableIds.includes(table.id) && table.seats >= partySize)
      .sort((a, b) => {
        const efficiencyA = partySize / a.seats;
        const efficiencyB = partySize / b.seats;
        return efficiencyB - efficiencyA || a.priority_rank - b.priority_rank;
      });

    if (availableTables.length > 0) {
      return { success: true, tableIds: [availableTables[0].id] };
    }

    return { success: false, tableIds: null };
  }

  static async allocateBookingToTables(
    bookingId: number, 
    partySize: number, 
    bookingDate: string, 
    bookingTime: string
  ): Promise<{
    success: boolean;
    alternatives?: any[];
    reason?: string;
  }> {
    console.log(`🎯 Attempting to allocate booking ${bookingId} for party of ${partySize}`);
    
    // Get venue ID from booking
    const { data: booking } = await supabase
      .from('bookings')
      .select('venue_id')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      console.error('❌ Booking not found');
      return { success: false, reason: 'Booking not found' };
    }

    const allocationResult = await this.allocateTable(
      partySize, 
      bookingDate, 
      bookingTime,
      this.DEFAULT_DURATION_MINUTES,
      booking.venue_id
    );
    
    if (!allocationResult.tableIds || allocationResult.tableIds.length === 0) {
      console.log(`❌ No tables available, marking booking ${bookingId} as unallocated`);
      
      // Mark as unallocated
      await supabase
        .from('bookings')
        .update({ 
          is_unallocated: true,
          table_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);
      
      return { 
        success: false, 
        alternatives: allocationResult.alternatives,
        reason: allocationResult.reason
      };
    }

    console.log(`✅ Allocating booking ${bookingId} to table ${allocationResult.tableIds[0]}`);
    
    // Allocate to primary table
    const { error } = await supabase
      .from('bookings')
      .update({ 
        table_id: allocationResult.tableIds[0],
        is_unallocated: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) {
      console.error('❌ Error updating booking:', error);
      return { success: false, reason: 'Failed to update booking' };
    }

    console.log(`✅ Successfully allocated booking ${bookingId} to table ${allocationResult.tableIds[0]}`);
    return { success: true };
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
    bookingTime: string,
    venueId?: string
  ): Promise<any[]> {
    try {
      // Get venue ID if not provided
      let targetVenueId = venueId;
      if (!targetVenueId) {
        const { data: venue } = await supabase
          .from('venues')
          .select('id')
          .eq('approval_status', 'approved')
          .limit(1)
          .single();
        
        if (!venue) return [];
        targetVenueId = venue.id;
      }

      // Fetch all active tables
      const { data: tables } = await supabase
        .from('tables')
        .select('*')
        .eq('status', 'active')
        .eq('venue_id', targetVenueId)
        .order('priority_rank');

      // Fetch existing bookings for the same date
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', bookingDate)
        .eq('venue_id', targetVenueId)
        .neq('status', 'cancelled')
        .neq('status', 'finished');

      if (!tables || !existingBookings) {
        return [];
      }

      // Use the availability service to check occupied tables
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

  private static isJoinGroupAvailable(group: any, occupiedTableIds: number[], partySize: number): boolean {
    console.log(`🔍 Checking join group "${group.name}": min=${group.min_party_size}, max=${group.max_party_size}, tables=[${group.table_ids.join(',')}]`);
    console.log(`   Party size: ${partySize}, Occupied tables: [${occupiedTableIds.join(',')}]`);
    
    // Check party size fits group capacity
    const sizeMatches = partySize >= group.min_party_size && partySize <= group.max_party_size;
    
    // Check all tables in group are available
    const allTablesAvailable = group.table_ids.every((tableId: number) => {
      const isAvailable = !occupiedTableIds.includes(tableId);
      if (!isAvailable) {
        console.log(`   ❌ Table ${tableId} is occupied`);
      }
      return isAvailable;
    });
    
    const isAvailable = sizeMatches && allTablesAvailable;
    console.log(`   ${isAvailable ? '✅' : '❌'} Group "${group.name}" available: ${isAvailable}`);
    
    return isAvailable;
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
      const bookingEnd = new Date(bookingStart.getTime() + ((booking.duration_minutes || this.DEFAULT_DURATION_MINUTES) * 60 * 1000));

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
