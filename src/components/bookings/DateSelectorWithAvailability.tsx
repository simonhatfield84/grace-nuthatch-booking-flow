
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, isAfter, isBefore } from "date-fns";
import { CalendarIcon } from 'lucide-react';
import { TableAvailabilityService } from "@/services/tableAvailabilityService";

interface DateSelectorWithAvailabilityProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date | undefined) => void;
  partySize: number;
  venueId?: string;
}

export const DateSelectorWithAvailability = ({
  selectedDate,
  onDateSelect,
  partySize,
  venueId
}: DateSelectorWithAvailabilityProps) => {
  // Get available dates based on actual time-slot availability
  const { data: availableDates = [], isLoading } = useQuery({
    queryKey: ['available-dates', partySize, venueId],
    queryFn: async () => {
      if (!venueId) return [];

      const endDate = addDays(new Date(), 60); // Show next 60 days
      const startDate = new Date();
      const availableDates: Date[] = [];

      console.log(`🔍 Checking availability for ${partySize} guests from ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);

      // Check each day in the range
      for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
        const dateStr = format(d, 'yyyy-MM-dd');
        
        // Get booking windows for this venue to determine service hours
        const { data: bookingWindows } = await supabase
          .from('booking_windows')
          .select('*')
          .eq('venue_id', venueId);

        if (!bookingWindows || bookingWindows.length === 0) continue;

        // Check if any booking window covers this day
        const dayName = format(d, 'EEE').toLowerCase();
        const activeWindows = bookingWindows.filter(window => 
          window.days.includes(dayName) &&
          (!window.start_date || dateStr >= window.start_date) &&
          (!window.end_date || dateStr <= window.end_date)
        );

        if (activeWindows.length === 0) continue;

        // Generate time slots based on booking windows
        const timeSlots: string[] = [];
        
        for (const window of activeWindows) {
          const startHour = parseInt(window.start_time.split(':')[0]);
          const startMin = parseInt(window.start_time.split(':')[1]);
          const endHour = parseInt(window.end_time.split(':')[0]);
          const endMin = parseInt(window.end_time.split(':')[1]);
          
          // Generate 15-minute intervals within the booking window
          for (let hour = startHour; hour <= endHour; hour++) {
            const startMinute = (hour === startHour) ? startMin : 0;
            const endMinute = (hour === endHour) ? endMin : 59;
            
            for (let minute = startMinute; minute <= endMinute; minute += 15) {
              if (hour === endHour && minute > endMin) break;
              
              const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
              if (!timeSlots.includes(timeSlot)) {
                timeSlots.push(timeSlot);
              }
            }
          }
        }

        console.log(`📅 Checking ${dateStr} with ${timeSlots.length} time slots for ${partySize} guests`);

        // Use the enhanced table availability service to check if any time slots are available
        let hasAvailability = false;
        let availableSlots = 0;
        
        for (const timeSlot of timeSlots) {
          try {
            const result = await TableAvailabilityService.getEnhancedTableAllocation(
              partySize,
              dateStr,
              timeSlot,
              venueId,
              120 // Default 2 hour duration
            );
            
            if (result.success) {
              hasAvailability = true;
              availableSlots++;
              console.log(`✅ Found availability on ${dateStr} at ${timeSlot} for ${partySize} guests`);
              // Don't break - continue checking to get a count of available slots
            }
          } catch (error) {
            console.warn(`⚠️ Error checking availability for ${dateStr} at ${timeSlot}:`, error);
          }
        }

        if (hasAvailability) {
          console.log(`✅ Date ${dateStr} available with ${availableSlots} time slots for ${partySize} guests`);
          availableDates.push(new Date(d));
        } else {
          console.log(`❌ Date ${dateStr} unavailable - no time slots work for ${partySize} guests`);
        }
      }

      console.log(`📊 Found ${availableDates.length} available dates for ${partySize} guests`);
      return availableDates;
    },
    enabled: !!venueId && partySize > 0,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    refetchInterval: 5 * 60 * 1000 // Refetch every 5 minutes
  });

  const isDateAvailable = (date: Date) => {
    return availableDates.some(availableDate => 
      format(availableDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const isDateDisabled = (date: Date) => {
    // Disable past dates
    if (isBefore(date, new Date())) return true;
    
    // Disable dates more than 60 days in future
    if (isAfter(date, addDays(new Date(), 60))) return true;
    
    // Disable dates without availability
    return !isDateAvailable(date);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900">
      <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
        <CardTitle className="text-2xl text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <CalendarIcon className="h-6 w-6" />
          Choose your date
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          Select from available dates for {partySize} {partySize === 1 ? 'person' : 'people'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 bg-white dark:bg-gray-900">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Checking availability...</div>
          </div>
        ) : (
          <>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onDateSelect}
              disabled={isDateDisabled}
              className="rounded-md border border-gray-300 dark:border-gray-600 mx-auto"
            />
            
            {availableDates.length === 0 && !isLoading && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800 text-center">
                <p className="text-amber-800 dark:text-amber-200">
                  No availability found for {partySize} {partySize === 1 ? 'person' : 'people'} in the next 60 days.
                </p>
                <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
                  Try reducing your party size or contact us directly.
                </p>
              </div>
            )}

            {availableDates.length > 0 && (
              <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                {availableDates.length} dates available for your party size
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
