
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Clock, CheckCircle, Loader2 } from 'lucide-react';
import { UnifiedAvailabilityService } from "@/services/unifiedAvailabilityService";

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
  // Get available time slots using unified service
  const { data: timeSlotData = {}, isLoading } = useQuery({
    queryKey: ['unified-time-slots', selectedDate, selectedService?.id, partySize, venueId],
    queryFn: async () => {
      if (!selectedDate || !selectedService || !venueId) return {};

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      console.log(`🕐 Checking time slots for ${dateStr} (${partySize} guests)`);

      // Generate time slots (every 15 minutes from 17:00 to 22:00)
      const timeSlots: string[] = [];
      for (let hour = 17; hour <= 22; hour++) {
        for (let minute of [0, 15, 30, 45]) {
          if (hour === 22 && minute > 0) break; // Stop at 22:00
          timeSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        }
      }

      // Check availability for each time slot
      const availabilityChecks = await Promise.all(
        timeSlots.map(async (timeSlot) => {
          const result = await UnifiedAvailabilityService.checkTimeSlotAvailability(
            venueId,
            dateStr,
            timeSlot,
            partySize
          );
          return {
            time: timeSlot,
            available: result.available,
            reason: result.reason,
            alternatives: result.suggestedTimes
          };
        })
      );

      const availableSlots = availabilityChecks.filter(slot => slot.available).map(slot => slot.time);
      const unavailableSlots = availabilityChecks.filter(slot => !slot.available);

      console.log(`✅ Found ${availableSlots.length} available slots out of ${timeSlots.length}`);
      
      return {
        availableSlots,
        unavailableSlots: unavailableSlots.reduce((acc, slot) => {
          acc[slot.time] = { reason: slot.reason, alternatives: slot.alternatives };
          return acc;
        }, {} as Record<string, { reason?: string; alternatives?: string[] }>)
      };
    },
    enabled: !!selectedDate && !!selectedService && !!venueId && partySize > 0,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes (shorter than date availability)
  });

  const { availableSlots = [], unavailableSlots = {} } = timeSlotData;

  if (!selectedDate || !selectedService) {
    return (
      <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Please select a date and service first
          </p>
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
          Available times for {format(selectedDate, 'EEEE, MMMM do')} - {partySize} {partySize === 1 ? 'person' : 'people'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-700 dark:text-gray-300">
              Validating time slots against table availability...
            </p>
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-6 border border-amber-200 dark:border-amber-800">
              <p className="text-amber-800 dark:text-amber-200 font-medium mb-2">
                No tables available for {partySize} guests on this date
              </p>
              <p className="text-amber-700 dark:text-amber-300 text-sm">
                Try selecting a different date or reducing your party size
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {availableSlots.map((timeSlot) => (
                <Button
                  key={timeSlot}
                  variant={selectedTime === timeSlot ? "default" : "outline"}
                  onClick={() => onTimeSelect(timeSlot)}
                  className={`relative h-12 flex items-center justify-center ${
                    selectedTime === timeSlot 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {timeSlot}
                  {selectedTime === timeSlot && (
                    <CheckCircle className="h-4 w-4 ml-2" />
                  )}
                </Button>
              ))}
            </div>

            <div className="mt-6 text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {availableSlots.length} time slots available
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                ✅ Each slot verified for actual table availability
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
