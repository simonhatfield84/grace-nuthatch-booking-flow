
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

  const handleTimeSelect = (time: string) => {
    console.log(`🕐 Time selected: ${time}`);
    onTimeSelect(time);
    // Auto-advance will be handled by parent component
  };

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

  const getEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(hours + 2, minutes); // Assuming 2-hour duration
    return endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
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
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800 text-sm text-center">
              We will require your table to be returned at the end time shown
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {availableSlots.map((slot) => (
              <Button
                key={slot.time}
                variant={selectedTime === slot.time ? "default" : "outline"}
                onClick={() => handleTimeSelect(slot.time)}
                className={`relative h-16 flex flex-col items-center justify-center ${
                  selectedTime === slot.time 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{slot.time}</div>
                <div className="text-xs opacity-75">
                  until {getEndTime(slot.time)}
                </div>
                {selectedTime === slot.time && (
                  <CheckCircle className="h-4 w-4 absolute top-1 right-1" />
                )}
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
