import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, AlertTriangle, Loader2 } from 'lucide-react';
import { TimeSlotButton } from '../ui/TimeSlotButton';
import { format } from 'date-fns';
import { fetchTimeSlots } from '@/features/bookingAPI';

interface TimeStepUIProps {
  venueSlug: string;
  serviceId: string;
  partySize: number;
  selectedDate?: Date;
  selectedTime?: string;
  onTimeSelect: (time: string) => void;
}

export function TimeStepUI({ 
  venueSlug,
  serviceId,
  partySize,
  selectedDate, 
  selectedTime, 
  onTimeSelect 
}: TimeStepUIProps) {
  const [selected, setSelected] = useState(selectedTime);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!selectedDate) return;

    const loadTimeSlots = async () => {
      setIsLoading(true);
      try {
        const slots = await fetchTimeSlots(
          venueSlug,
          serviceId,
          partySize,
          format(selectedDate, 'yyyy-MM-dd')
        );
        setTimeSlots(slots);
      } catch (error) {
        console.error('Failed to load time slots:', error);
        setTimeSlots([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTimeSlots();
  }, [venueSlug, serviceId, partySize, selectedDate]);

  const handleTimeSelect = (time: string) => {
    setSelected(time);
    onTimeSelect(time);
  };

  if (!selectedDate) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please select a date first
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-nuthatch-green" />
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <Alert className="bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          No availability found for {format(selectedDate, 'EEEE, MMMM d')}.
          Please try a different date or party size.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          We will require your table to be returned within 2 hours of your reservation time.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {timeSlots.map((time) => (
          <TimeSlotButton
            key={time}
            time={time}
            isSelected={selected === time}
            onClick={() => handleTimeSelect(time)}
          />
        ))}
      </div>
    </div>
  );
}
