
import React from 'react';
import { Button } from '@/components/ui/button';
import { AvailabilityService } from '@/services/core/AvailabilityService';
import { format } from 'date-fns';

interface SimplifiedTimeSelectorProps {
  selectedDate: Date | null;
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  partySize: number;
  venueId: string;
}

export function SimplifiedTimeSelector({
  selectedDate,
  selectedTime,
  onTimeSelect,
  partySize,
  venueId
}: SimplifiedTimeSelectorProps) {
  const [timeSlots, setTimeSlots] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!selectedDate || !venueId) return;

    const fetchTimeSlots = async () => {
      setLoading(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const slots = await AvailabilityService.getAvailableTimeSlots(venueId, dateStr, partySize);
        setTimeSlots(slots.map(slot => slot.time));
      } catch (error) {
        console.error('Error fetching time slots:', error);
        setTimeSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeSlots();
  }, [selectedDate, venueId, partySize]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading available times...</div>;
  }

  if (timeSlots.length === 0) {
    return <div className="text-sm text-muted-foreground">No times available for this date</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {timeSlots.map((time) => (
        <Button
          key={time}
          variant={selectedTime === time ? "default" : "outline"}
          size="sm"
          onClick={() => onTimeSelect(time)}
        >
          {time}
        </Button>
      ))}
    </div>
  );
}
