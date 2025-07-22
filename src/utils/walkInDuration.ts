
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
  console.log('🔍 calculateWalkInDuration called with:', {
    clickedTime,
    tableId,
    bookingsCount: bookings.length,
    defaultDuration
  });

  // Get current time or clicked time (whichever is later for past times)
  const now = new Date();
  const currentTimeString = format(now, 'HH:mm');
  const actualStartTime = clickedTime < currentTimeString ? currentTimeString : clickedTime;
  
  console.log('⏰ Time calculation:', {
    currentTime: currentTimeString,
    clickedTime,
    actualStartTime
  });

  // Find next booking on this table today - include all statuses except cancelled
  const todayBookings = bookings.filter(booking => {
    const isCorrectTable = booking.table_id === tableId || booking.original_table_id === tableId;
    const isNotCancelled = booking.status !== 'cancelled';
    const isAfterStartTime = booking.booking_time > actualStartTime;
    
    console.log('📋 Checking booking:', {
      id: booking.id,
      guest_name: booking.guest_name,
      table_id: booking.table_id,
      original_table_id: booking.original_table_id,
      booking_time: booking.booking_time,
      status: booking.status,
      isCorrectTable,
      isNotCancelled,
      isAfterStartTime,
      include: isCorrectTable && isNotCancelled && isAfterStartTime
    });
    
    return isCorrectTable && isNotCancelled && isAfterStartTime;
  }).sort((a, b) => a.booking_time.localeCompare(b.booking_time));

  console.log('📊 Filtered bookings for squeeze calculation:', {
    todayBookingsCount: todayBookings.length,
    nextBookings: todayBookings.map(b => ({
      id: b.id,
      guest_name: b.guest_name,
      booking_time: b.booking_time,
      status: b.status
    }))
  });

  if (todayBookings.length === 0) {
    console.log('✅ No upcoming bookings, using default duration:', defaultDuration);
    return defaultDuration;
  }

  const nextBooking = todayBookings[0];
  console.log('🎯 Next booking found:', {
    id: nextBooking.id,
    guest_name: nextBooking.guest_name,
    booking_time: nextBooking.booking_time,
    status: nextBooking.status
  });

  try {
    const startTime = parse(actualStartTime, 'HH:mm', new Date());
    const nextBookingTime = parse(nextBooking.booking_time, 'HH:mm', new Date());
    
    // Calculate available minutes until next booking
    const availableMinutes = Math.floor((nextBookingTime.getTime() - startTime.getTime()) / (1000 * 60));
    
    console.log('⏱️ Duration calculation:', {
      startTime: actualStartTime,
      nextBookingTime: nextBooking.booking_time,
      availableMinutes,
      defaultDuration
    });
    
    // Use the smaller of default duration or available time (with 15-min buffer)
    const maxDuration = Math.max(15, availableMinutes - 15); // Always allow at least 15 minutes
    const finalDuration = Math.min(defaultDuration, maxDuration);
    
    console.log('🎯 Final duration decision:', {
      availableMinutes,
      maxDuration,
      defaultDuration,
      finalDuration,
      squeezed: finalDuration < defaultDuration
    });
    
    return finalDuration;
  } catch (error) {
    console.error('❌ Error parsing times, using default duration:', error);
    return defaultDuration;
  }
};
