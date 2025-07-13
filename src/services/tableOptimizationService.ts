
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface TableSuggestion {
  tableId: number;
  tableLabel: string;
  seats: number;
  sectionName?: string;
  availableDuration: number;
  priorityRank: number;
  isJoinGroup?: boolean;
  joinGroupTables?: number[];
  reason: string;
}

export interface TableOptimizationResult {
  primaryTableAvailable: boolean;
  suggestedTables: TableSuggestion[];
  joinGroupOptions: TableSuggestion[];
  splitPartyOptions: TableSuggestion[];
}

export class TableOptimizationService {
  /**
   * Find optimal table options for a walk-in party
   */
  static async optimizeTableSelection(
    requestedTableId: number,
    partySize: number,
    date: string,
    time: string,
    duration: number,
    venueId: string
  ): Promise<TableOptimizationResult> {
    try {
      // Get all tables with their sections and join groups
      const { data: tables, error: tablesError } = await supabase
        .from('tables')
        .select(`
          *,
          sections (name)
        `)
        .eq('venue_id', venueId)
        .eq('status', 'active')
        .order('priority_rank');

      if (tablesError) throw tablesError;

      // Get existing bookings for the date
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', date)
        .eq('venue_id', venueId)
        .neq('status', 'cancelled')
        .neq('status', 'finished');

      if (bookingsError) throw bookingsError;

      // Get join groups
      const { data: joinGroups, error: joinGroupsError } = await supabase
        .from('join_groups')
        .select('*')
        .eq('venue_id', venueId);

      if (joinGroupsError) throw joinGroupsError;

      const suggestions: TableSuggestion[] = [];
      const joinGroupOptions: TableSuggestion[] = [];
      const splitPartyOptions: TableSuggestion[] = [];

      // Check primary table availability
      const primaryTable = tables?.find(t => t.id === requestedTableId);
      const primaryTableAvailable = primaryTable ? 
        this.checkTableAvailability(primaryTable, bookings || [], time, duration, partySize) : false;

      // Find alternative single tables
      for (const table of tables || []) {
        if (table.id === requestedTableId) continue;

        const availability = this.checkTableAvailability(table, bookings || [], time, duration, partySize);
        
        if (availability.available) {
          suggestions.push({
            tableId: table.id,
            tableLabel: table.label,
            seats: table.seats,
            sectionName: table.sections?.name,
            availableDuration: availability.maxDuration,
            priorityRank: table.priority_rank,
            reason: this.getSuggestionReason(table, partySize, availability.maxDuration, duration)
          });
        }
      }

      // Find join group options for larger parties
      if (partySize > 8) {
        for (const group of joinGroups || []) {
          if (partySize >= group.min_party_size && partySize <= group.max_party_size) {
            const groupTables = tables?.filter(t => group.table_ids.includes(t.id)) || [];
            const totalSeats = groupTables.reduce((sum, t) => sum + t.seats, 0);
            
            if (totalSeats >= partySize) {
              const groupAvailable = groupTables.every(table => 
                this.checkTableAvailability(table, bookings || [], time, duration, partySize).available
              );

              if (groupAvailable) {
                joinGroupOptions.push({
                  tableId: group.id,
                  tableLabel: group.name,
                  seats: totalSeats,
                  availableDuration: duration,
                  priorityRank: Math.min(...groupTables.map(t => t.priority_rank)),
                  isJoinGroup: true,
                  joinGroupTables: group.table_ids,
                  reason: `Join group accommodates ${partySize} guests across ${groupTables.length} tables`
                });
              }
            }
          }
        }
      }

      // Find split party options for very large parties
      if (partySize > 12) {
        const availableTables = suggestions.slice(0, 4); // Top 4 alternatives
        if (availableTables.length >= 2) {
          const combinedSeats = availableTables.slice(0, 2).reduce((sum, t) => sum + t.seats, 0);
          if (combinedSeats >= partySize) {
            splitPartyOptions.push({
              tableId: -1, // Special ID for split option
              tableLabel: `${availableTables[0].tableLabel} + ${availableTables[1].tableLabel}`,
              seats: combinedSeats,
              availableDuration: Math.min(availableTables[0].availableDuration, availableTables[1].availableDuration),
              priorityRank: Math.min(availableTables[0].priorityRank, availableTables[1].priorityRank),
              reason: `Split party across two nearby tables`
            });
          }
        }
      }

      // Sort suggestions by priority rank and seats efficiency
      suggestions.sort((a, b) => {
        const efficiencyA = partySize / a.seats;
        const efficiencyB = partySize / b.seats;
        return (b.priorityRank - a.priorityRank) || (efficiencyB - efficiencyA);
      });

      return {
        primaryTableAvailable: primaryTableAvailable.available,
        suggestedTables: suggestions.slice(0, 5), // Top 5 suggestions
        joinGroupOptions,
        splitPartyOptions
      };

    } catch (error) {
      console.error('Error optimizing table selection:', error);
      return {
        primaryTableAvailable: false,
        suggestedTables: [],
        joinGroupOptions: [],
        splitPartyOptions: []
      };
    }
  }

  private static checkTableAvailability(
    table: any,
    bookings: any[],
    time: string,
    duration: number,
    partySize: number
  ): { available: boolean; maxDuration: number } {
    // Check if table can accommodate party size
    if (table.seats < partySize) {
      return { available: false, maxDuration: 0 };
    }

    // Check for booking conflicts
    const [hours, minutes] = time.split(':').map(Number);
    const requestedStart = new Date();
    requestedStart.setHours(hours, minutes, 0, 0);
    const requestedEnd = new Date(requestedStart.getTime() + (duration * 60 * 1000));

    const conflictingBookings = bookings.filter(booking => {
      if (booking.table_id !== table.id) return false;
      
      const [bookingHours, bookingMinutes] = booking.booking_time.split(':').map(Number);
      const bookingStart = new Date();
      bookingStart.setHours(bookingHours, bookingMinutes, 0, 0);
      const bookingEnd = new Date(bookingStart.getTime() + ((booking.duration_minutes || 120) * 60 * 1000));

      return (requestedStart < bookingEnd && requestedEnd > bookingStart);
    });

    if (conflictingBookings.length === 0) {
      return { available: true, maxDuration: duration };
    }

    // Calculate maximum available duration
    const nextBooking = conflictingBookings
      .map(booking => {
        const [bookingHours, bookingMinutes] = booking.booking_time.split(':').map(Number);
        const bookingStart = new Date();
        bookingStart.setHours(bookingHours, bookingMinutes, 0, 0);
        return bookingStart;
      })
      .filter(start => start > requestedStart)
      .sort((a, b) => a.getTime() - b.getTime())[0];

    if (nextBooking) {
      const maxDuration = Math.floor((nextBooking.getTime() - requestedStart.getTime()) / (1000 * 60));
      return { available: maxDuration >= 30, maxDuration: Math.max(30, maxDuration) };
    }

    return { available: false, maxDuration: 0 };
  }

  private static getSuggestionReason(
    table: any,
    partySize: number,
    availableDuration: number,
    requestedDuration: number
  ): string {
    const seatEfficiency = partySize / table.seats;
    
    if (seatEfficiency >= 0.8) {
      return "Perfect size match";
    } else if (seatEfficiency >= 0.6) {
      return "Good size match";
    } else if (table.priority_rank <= 3) {
      return "Premium table available";
    } else if (availableDuration < requestedDuration) {
      return `Available for ${availableDuration} minutes`;
    } else {
      return "Alternative option";
    }
  }
}
