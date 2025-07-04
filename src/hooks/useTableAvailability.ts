
import { useMemo } from "react";
import { Table } from "./useTables";
import { Booking } from "./useBookings";
import { format, addMinutes, parseISO } from "date-fns";

interface AvailabilityCheck {
  date: string;
  time: string;
  partySize: number;
  durationMinutes?: number;
}

export const useTableAvailability = (tables: Table[], bookings: Booking[]) => {
  const checkTableAvailability = useMemo(() => {
    return ({ date, time, partySize, durationMinutes = 120 }: AvailabilityCheck) => {
      // Filter online bookable tables that can accommodate the party size
      const suitableTables = tables.filter(table => 
        table.online_bookable && 
        table.seats >= partySize &&
        table.status === 'active'
      );

      if (suitableTables.length === 0) {
        return { available: false, availableTables: [], reason: 'No suitable tables' };
      }

      // Check which tables are available at the requested time
      const requestedDateTime = new Date(`${date}T${time}`);
      const endDateTime = addMinutes(requestedDateTime, durationMinutes);

      const availableTables = suitableTables.filter(table => {
        // Check if table has any conflicting bookings
        const conflictingBookings = bookings.filter(booking => 
          booking.table_id === table.id &&
          booking.booking_date === date &&
          booking.status !== 'cancelled' &&
          booking.status !== 'finished'
        );

        // If no bookings for this table on this date, it's available
        if (conflictingBookings.length === 0) {
          return true;
        }

        // Check time conflicts
        return !conflictingBookings.some(booking => {
          const bookingDateTime = new Date(`${date}T${booking.booking_time}`);
          const bookingEndTime = addMinutes(bookingDateTime, durationMinutes);

          // Check if times overlap
          return (
            (requestedDateTime >= bookingDateTime && requestedDateTime < bookingEndTime) ||
            (endDateTime > bookingDateTime && endDateTime <= bookingEndTime) ||
            (requestedDateTime <= bookingDateTime && endDateTime >= bookingEndTime)
          );
        });
      });

      // Sort by priority rank (lower number = higher priority)
      const sortedAvailableTables = availableTables.sort((a, b) => a.priority_rank - b.priority_rank);

      return {
        available: sortedAvailableTables.length > 0,
        availableTables: sortedAvailableTables,
        bestTable: sortedAvailableTables[0] || null,
        reason: sortedAvailableTables.length > 0 ? null : 'All suitable tables are booked'
      };
    };
  }, [tables, bookings]);

  const findAvailableTimeSlots = useMemo(() => {
    return (date: string, partySize: number, startTime: string, endTime: string, durationMinutes = 120) => {
      const availableSlots: string[] = [];
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);

      let currentHour = startHour;
      let currentMin = startMin;

      while (currentHour < endHour || (currentHour === endHour && currentMin <= endMin - (durationMinutes / 60))) {
        const timeSlot = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
        
        const availability = checkTableAvailability({
          date,
          time: timeSlot,
          partySize,
          durationMinutes
        });

        if (availability.available) {
          availableSlots.push(timeSlot);
        }

        // Add 15 minutes
        currentMin += 15;
        if (currentMin >= 60) {
          currentMin = 0;
          currentHour++;
        }
      }

      return availableSlots;
    };
  }, [checkTableAvailability]);

  return {
    checkTableAvailability,
    findAvailableTimeSlots
  };
};
