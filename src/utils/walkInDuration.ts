
import { format, parse, addMinutes } from "date-fns";

interface WalkInDurationParams {
  clickedTime: string;
  tableId: number;
  bookings: any[];
  defaultDuration?: number;
}

export const calculateWalkInDuration = ({
  clickedTime,
  tableId,
  bookings,
  defaultDuration = 90
}: WalkInDurationParams): number => {
  // Get current time or clicked time (whichever is later for past times)
  const now = new Date();
  const currentTimeString = format(now, 'HH:mm');
  const actualStartTime = clickedTime < currentTimeString ? currentTimeString : clickedTime;
  
  // Find next booking on this table today
  const todayBookings = bookings.filter(booking => 
    booking.table_id === tableId && 
    booking.status !== 'cancelled' &&
    booking.booking_time > actualStartTime
  ).sort((a, b) => a.booking_time.localeCompare(b.booking_time));

  if (todayBookings.length === 0) {
    // No upcoming bookings, use default duration
    return defaultDuration;
  }

  const nextBooking = todayBookings[0];
  const startTime = parse(actualStartTime, 'HH:mm', new Date());
  const nextBookingTime = parse(nextBooking.booking_time, 'HH:mm', new Date());
  
  // Calculate available minutes until next booking
  const availableMinutes = Math.floor((nextBookingTime.getTime() - startTime.getTime()) / (1000 * 60));
  
  // Use the smaller of default duration or available time (with 15-min buffer)
  const maxDuration = Math.max(15, availableMinutes - 15); // Always allow at least 15 minutes
  
  return Math.min(defaultDuration, maxDuration);
};
