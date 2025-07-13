
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, startOfMonth, endOfMonth, isBefore, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { OptimizedAvailabilityService } from "@/services/optimizedAvailabilityService";

interface DateSelectorWithAvailabilityProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  partySize: number;
  venueId: string;
}

export const DateSelectorWithAvailability = ({
  selectedDate,
  onDateSelect,
  partySize,
  venueId
}: DateSelectorWithAvailabilityProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get available dates for the current month
  const { data: availableDates = [], isLoading } = useQuery({
    queryKey: ['available-dates', venueId, partySize, format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      if (!venueId) return [];

      console.log(`📅 Checking availability for ${format(currentMonth, 'yyyy-MM')} (${partySize} guests)`);
      
      const startDate = startOfMonth(currentMonth);
      const endDate = endOfMonth(currentMonth);
      
      const availableDates = await OptimizedAvailabilityService.getAvailableDatesInChunks(
        venueId,
        partySize,
        startDate,
        endDate
      );

      console.log(`✅ Found ${availableDates.length} available dates`);
      return availableDates;
    },
    enabled: !!venueId && partySize > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const disabledDates = (date: Date) => {
    // Disable past dates
    if (isBefore(date, startOfDay(new Date()))) {
      return true;
    }
    
    // If still loading, don't disable any future dates
    if (isLoading) {
      return false;
    }
    
    // Check if date is in available dates
    const dateStr = format(date, 'yyyy-MM-dd');
    return !availableDates.includes(dateStr);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      console.log(`📅 Date selected: ${format(date, 'yyyy-MM-dd')}`);
      onDateSelect(date);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900">
      <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
        <CardTitle className="text-2xl text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <CalendarIcon className="h-6 w-6" />
          Select a date
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          Choose your preferred date for {partySize} {partySize === 1 ? 'person' : 'people'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-700 dark:text-gray-300">
              Checking availability...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              onMonthChange={setCurrentMonth}
              disabled={disabledDates}
              className="mx-auto"
              fromDate={new Date()}
              toDate={addDays(new Date(), 90)} // Allow booking up to 3 months ahead
            />
            
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              {availableDates.length === 0 && !isLoading ? (
                <p className="text-amber-600 dark:text-amber-400">
                  No availability found for {partySize} {partySize === 1 ? 'person' : 'people'} this month.
                  Try selecting a different month or reducing your party size.
                </p>
              ) : (
                <p>
                  {availableDates.length} {availableDates.length === 1 ? 'date' : 'dates'} available this month
                </p>
              )}
            </div>

            {selectedDate && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-green-800 dark:text-green-200 text-center">
                  <strong>{format(selectedDate, 'EEEE, MMMM do, yyyy')}</strong> selected
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
