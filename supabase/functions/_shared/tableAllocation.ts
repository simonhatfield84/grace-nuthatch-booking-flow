/**
 * Shared Table Allocation Logic
 * Used by both check-availability and booking-submit to ensure consistency
 */

interface Table {
  id: number;
  seats: number;
  label?: string;
  online_bookable?: boolean;
}

interface JoinGroup {
  id: number;
  name: string;
  table_ids: number[];
  min_party_size: number;
  max_party_size: number;
}

interface Booking {
  booking_time: string;
  end_time: string;
  table_id: number;
  party_size: number;
}

interface Block {
  start_time: string;
  end_time: string;
  table_ids: number[] | null;
}

export interface AllocationParams {
  venueId: string;
  date: string;
  time: string;
  partySize: number;
  duration: number;
}

export interface AllocationResult {
  available: boolean;
  tableId?: number;
  joinGroupId?: number;
  tableIds?: number[];
  reason?: string;
}

/**
 * Find available table allocation for a booking
 */
export async function findAvailableTable(
  supabase: any,
  params: AllocationParams
): Promise<AllocationResult> {
  const { venueId, date, time, partySize, duration } = params;

  // Get tables for venue
  const { data: tables, error: tablesError } = await supabase
    .from('tables')
    .select('id, seats, label, online_bookable')
    .eq('venue_id', venueId)
    .eq('online_bookable', true)
    .eq('status', 'active');

  if (tablesError || !tables || tables.length === 0) {
    return { available: false, reason: 'No tables available' };
  }

  // Get join groups for venue
  const { data: joinGroups } = await supabase
    .from('join_groups')
    .select('id, name, table_ids, min_party_size, max_party_size')
    .eq('venue_id', venueId);

  // Get existing bookings for this date
  const { data: bookings } = await supabase
    .from('bookings')
    .select('booking_time, end_time, table_id, party_size')
    .eq('venue_id', venueId)
    .eq('booking_date', date)
    .in('status', ['confirmed', 'seated', 'pending_payment']);

  // Get blocks for this date
  const { data: blocks } = await supabase
    .from('blocks')
    .select('start_time, end_time, table_ids')
    .eq('venue_id', venueId)
    .eq('date', date);

  // Calculate unavailable table IDs
  const unavailableTableIds = getUnavailableTableIds(
    time,
    duration,
    bookings || [],
    blocks || []
  );

  // Filter available tables
  const availableTables = tables.filter(
    (t: Table) => !unavailableTableIds.includes(t.id)
  );

  // Try single table first
  const suitableSingleTable = availableTables
    .filter((t: Table) => t.seats >= partySize)
    .sort((a: Table, b: Table) => a.seats - b.seats)[0];

  if (suitableSingleTable) {
    return {
      available: true,
      tableId: suitableSingleTable.id,
    };
  }

  // Try join groups
  if (joinGroups && joinGroups.length > 0) {
    const suitableJoinGroup = joinGroups
      .filter((group: JoinGroup) => {
        if (partySize < group.min_party_size || partySize > group.max_party_size) {
          return false;
        }
        return group.table_ids.every((tableId: number) =>
          !unavailableTableIds.includes(tableId)
        );
      })
      .sort((a: JoinGroup, b: JoinGroup) => a.max_party_size - b.max_party_size)[0];

    if (suitableJoinGroup) {
      return {
        available: true,
        joinGroupId: suitableJoinGroup.id,
        tableIds: suitableJoinGroup.table_ids,
      };
    }
  }

  return {
    available: false,
    reason: `No table or join group available for ${partySize} guests`,
  };
}

/**
 * Get unavailable table IDs for a given time slot
 */
function getUnavailableTableIds(
  time: string,
  durationMinutes: number,
  bookings: Booking[],
  blocks: Block[]
): number[] {
  const slotStart = timeToMinutes(time);
  const slotEnd = slotStart + durationMinutes;

  const unavailableIds: number[] = [];

  // Check venue-wide blocks first
  for (const block of blocks) {
    const blockStart = timeToMinutes(block.start_time);
    const blockEnd = timeToMinutes(block.end_time);

    if (slotStart < blockEnd && slotEnd > blockStart) {
      if (!block.table_ids || block.table_ids.length === 0) {
        // Venue-wide block - all tables unavailable
        return bookings.map(b => b.table_id).concat(unavailableIds);
      } else {
        // Specific table blocks
        unavailableIds.push(...block.table_ids);
      }
    }
  }

  // Check bookings
  for (const booking of bookings) {
    if (!booking.table_id) continue;

    const bookingStart = timeToMinutes(booking.booking_time);
    const bookingEnd = timeToMinutes(booking.end_time);

    if (slotStart < bookingEnd && slotEnd > bookingStart) {
      unavailableIds.push(booking.table_id);
    }
  }

  return [...new Set(unavailableIds)];
}

/**
 * Helper: Time string to minutes
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Helper: Add minutes to time string
 */
export function addMinutesToTime(time: string, minutes: number): string {
  const totalMinutes = timeToMinutes(time) + minutes;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
