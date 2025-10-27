import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Users } from 'lucide-react';
import { format, isAfter, startOfDay } from 'date-fns';
import { CoreBookingService } from '@/services/core/BookingService';

interface PartyDateStepProps {
  venueId: string;
  initialParty?: number;
  initialDate?: Date;
  onContinue: (party: number, date: Date) => void;
}

export function PartyDateStep({ venueId, initialParty, initialDate, onContinue }: PartyDateStepProps) {
  const [partySize, setPartySize] = useState(initialParty || 2);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  
  // Fetch available dates
  const { data: availableDates = [], isLoading } = useQuery({
    queryKey: ['available-dates-v5', venueId, partySize],
    queryFn: () => CoreBookingService.getAvailableDates(venueId, partySize),
    staleTime: 2 * 60 * 1000
  });
  
  const isDateAvailable = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availableDates.includes(dateStr);
  };
  
  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date());
    return !isAfter(date, today) || !isDateAvailable(date);
  };
  
  const partySizes = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];
  
  return (
    <div className="space-y-6 p-4">
      <div>
        <Label className="text-base font-semibold mb-3 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Party Size
        </Label>
        <div className="grid grid-cols-5 gap-2">
          {partySizes.map(size => (
            <Button
              key={size}
              variant={partySize === size ? 'default' : 'outline'}
              onClick={() => setPartySize(size)}
              className="h-12"
            >
              {size}
            </Button>
          ))}
        </div>
      </div>
      
      <div>
        <Label className="text-base font-semibold mb-3">Select Date</Label>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading available dates...</div>
        ) : (
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={isDateDisabled}
            className="rounded-md border mx-auto"
            fromDate={new Date()}
          />
        )}
      </div>
      
      <Button
        onClick={() => selectedDate && onContinue(partySize, selectedDate)}
        disabled={!selectedDate}
        className="w-full h-12 text-base"
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}
