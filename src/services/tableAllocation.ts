import { supabase } from "@/integrations/supabase/client";
import { TableAvailabilityService } from "./tableAvailabilityService";

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

      // Use enhanced allocation service
      const result = await TableAvailabilityService.getEnhancedTableAllocation(
        partySize,
        bookingDate,
        bookingTime,
        targetVenueId,
        durationMinutes
      );

      if (result.success) {
        console.log(`✅ Enhanced allocation successful: tables [${result.tableIds?.join(', ')}]`);
        return { tableIds: result.tableIds };
      } else {
        console.log(`❌ No tables available, found ${result.alternatives?.length || 0} alternatives`);
        return {
          tableIds: null,
          alternatives: result.alternatives,
          reason: result.reason
        };
      }

    } catch (error) {
      console.error('❌ Table allocation error:', error);
      return {
        tableIds: null,
        reason: 'System error during allocation'
      };
    }
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
