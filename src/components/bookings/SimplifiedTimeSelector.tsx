
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addMinutes, parseISO } from "date-fns";
import { Clock } from 'lucide-react';

interface SimplifiedTimeSelectorProps {
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  selectedDate: Date | null;
  selectedService: any;
  partySize: number;
  venueId?: string;
}

export const SimplifiedTimeSelector = ({
  selectedTime,
  onTimeSelect,
  selectedDate,
  selectedService,
  partySize,
  venueId
}: SimplifiedTimeSelectorProps) => {
  // Get available time slots
  const { data: timeSlots = [], isLoading } = useQuery({
    queryKey: ['available-times', selectedDate, selectedService?.id, partySize, venueId],
    queryFn: async () => {
      if (!selectedDate || !selectedService || !venueId) return [];

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const dayName = format(selectedDate, 'EEE').toLowerCase();

      // Get booking windows for this service and day
      const { data: bookingWindows } = await supabase
        .from('booking_windows')
        .select('*')
        .eq('service_id', selectedService.id)
        .contains('days', [dayName]);

      if (!bookingWindows || bookingWindows.length === 0) return [];

      // Get existing bookings for this date
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('booking_time, party_size, table_id')
        .eq('booking_date', dateStr)
        .eq('venue_id', venueId)
        .neq('status', 'cancelled');

      // Get venue tables
      const { data: tables } = await supabase
        .from('tables')
        .select('id, seats')
        .eq('venue_id', venueId)
        .eq('status', 'active');

      const availableSlots: { time: string; available: boolean }[] = [];

      // Generate time slots from booking windows
      bookingWindows.forEach(window => {
        let currentTime = window.start_time;
        
        while (currentTime < window.end_time) {
          // Simple availability check - count occupied seats vs total capacity
          const timeBookings = existingBookings?.filter(b => b.booking_time === currentTime) || [];
          const occupiedSeats = timeBookings.reduce((sum, booking) => sum + booking.party_size, 0);
          const totalSeats = tables?.reduce((sum, table) => sum + table.seats, 0) || 0;
          
          const hasCapacity = occupiedSeats + partySize <= totalSeats * 0.8; // 80% capacity threshold
          
          availableSlots.push({
            time: currentTime,
            available: hasCapacity
          });

          // Move to next 30-minute slot
          const [hours, minutes] = currentTime.split(':').map(Number);
          const nextSlot = addMinutes(new Date(0, 0, 0, hours, minutes), 30);
          currentTime = format(nextSlot, 'HH:mm');
          
          // Break if we've reached or passed end time
          if (currentTime >= window.end_time) break;
        }
      });

      // Remove duplicates and sort
      const uniqueSlots = availableSlots.reduce((acc, slot) => {
        const existing = acc.find(s => s.time === slot.time);
        if (!existing) {
          acc.push(slot);
        } else if (slot.available && !existing.available) {
          // If we find an available slot where we previously had unavailable, update it
          existing.available = true;
        }
        return acc;
      }, [] as { time: string; available: boolean }[]);

      return uniqueSlots.sort((a, b) => a.time.localeCompare(b.time));
    },
    enabled: !!selectedDate && !!selectedService && !!venueId && partySize > 0
  });

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Checking available times...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900">
      <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
        <CardTitle className="text-2xl text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Clock className="h-6 w-6" />
          Choose your time
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          Available times for {selectedService?.title} on {selectedDate ? format(selectedDate, 'EEEE, MMMM do') : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 bg-white dark:bg-gray-900">
        {timeSlots.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No available times for your selection.</p>
            <p className="text-gray-400 text-sm mt-1">Try selecting a different date or service.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {timeSlots.map((slot) => (
              <Button
                key={slot.time}
                variant={selectedTime === slot.time ? "default" : "outline"}
                disabled={!slot.available}
                className={`h-12 text-sm font-medium transition-all duration-200 ${
                  selectedTime === slot.time
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : slot.available
                    ? 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    : 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800'
                }`}
                onClick={() => slot.available && onTimeSelect(slot.time)}
              >
                <div className="flex flex-col items-center">
                  <span className="font-medium">{slot.time}</span>
                  <span className="text-xs opacity-75">
                    {slot.available ? 'Available' : 'Fully booked'}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        )}
        
        {selectedTime && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-green-800 dark:text-green-200 text-sm">
              <strong>{selectedTime}</strong> selected for your reservation
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
