
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, startOfDay, isBefore } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { BookingService } from '../../services/BookingService';

interface DateStepProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  partySize: number;
  venueId: string;
}

export function DateStep({ selectedDate, onDateSelect, partySize, venueId }: DateStepProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: availableDates = [], isLoading } = useQuery({
    queryKey: ['available-dates', venueId, partySize, format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      if (!venueId) return [];

      console.log(`📅 Checking availability for ${format(currentMonth, 'yyyy-MM')} (${partySize} guests)`);
      
      const startDate = startOfDay(currentMonth);
      const endDate = addDays(startDate, 90);
      
      const availableDates = await BookingService.getAvailableDates(
        venueId,
        partySize,
        startDate,
        endDate
      );

      console.log(`✅ Found ${availableDates.length} available dates`);
      return availableDates;
    },
    enabled: !!venueId && partySize > 0,
    staleTime: 5 * 60 * 1000,
  });

  const disabledDates = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) {
      return true;
    }
    
    if (isLoading) {
      return false;
    }
    
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <CalendarIcon className="h-6 w-6" />
          Select a date
        </CardTitle>
        <CardDescription>
          Choose your preferred date for {partySize} {partySize === 1 ? 'person' : 'people'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-700">
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
              toDate={addDays(new Date(), 90)}
            />
            
            <div className="text-center text-sm text-gray-600">
              {availableDates.length === 0 && !isLoading ? (
                <p className="text-amber-600">
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
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800 text-center">
                  <strong>{format(selectedDate, 'EEEE, MMMM do, yyyy')}</strong> selected
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
