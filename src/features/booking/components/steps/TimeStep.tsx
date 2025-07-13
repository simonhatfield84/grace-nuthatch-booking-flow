
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Clock, CheckCircle, Loader2 } from 'lucide-react';
import { BookingService } from '../../services/BookingService';

interface TimeStepProps {
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  selectedDate: Date | null;
  partySize: number;
  venueId: string;
}

export function TimeStep({ selectedTime, onTimeSelect, selectedDate, partySize, venueId }: TimeStepProps) {
  const { data: timeSlots = [], isLoading } = useQuery({
    queryKey: ['time-slots', selectedDate, partySize, venueId],
    queryFn: async () => {
      if (!selectedDate || !venueId) return [];

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      console.log(`🕐 Checking time slots for ${dateStr} (${partySize} guests)`);

      const slots = await BookingService.getAvailableTimeSlots(venueId, dateStr, partySize);
      
      console.log(`✅ Found ${slots.filter(s => s.available).length} available slots`);
      return slots;
    },
    enabled: !!selectedDate && !!venueId && partySize > 0,
    staleTime: 2 * 60 * 1000,
  });

  const availableSlots = timeSlots.filter(slot => slot.available);

  if (!selectedDate) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">
            Please select a date first
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Clock className="h-6 w-6" />
          Choose your time
        </CardTitle>
        <CardDescription>
          Available times for {format(selectedDate, 'EEEE, MMMM do')} - {partySize} {partySize === 1 ? 'person' : 'people'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-700">
              Checking time slot availability...
            </p>
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
              <p className="text-amber-800 font-medium mb-2">
                No tables available for {partySize} guests on this date
              </p>
              <p className="text-amber-700 text-sm">
                Try selecting a different date or reducing your party size
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {availableSlots.map((slot) => (
                <Button
                  key={slot.time}
                  variant={selectedTime === slot.time ? "default" : "outline"}
                  onClick={() => onTimeSelect(slot.time)}
                  className={`relative h-12 flex items-center justify-center ${
                    selectedTime === slot.time 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {slot.time}
                  {selectedTime === slot.time && (
                    <CheckCircle className="h-4 w-4 ml-2" />
                  )}
                </Button>
              ))}
            </div>

            <div className="mt-6 text-center">
              <div className="text-sm text-gray-600">
                {availableSlots.length} time slots available
              </div>
              <div className="text-xs text-gray-500 mt-1">
                ✅ Each slot verified for table availability
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
