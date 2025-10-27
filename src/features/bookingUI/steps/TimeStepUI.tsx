import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, AlertTriangle } from 'lucide-react';
import { TimeSlotButton } from '../ui/TimeSlotButton';
import { format } from 'date-fns';

interface TimeStepUIProps {
  selectedTime?: string;
  selectedDate?: Date;
  onTimeSelect: (time: string) => void;
}

// Stub time slots
const STUB_TIME_SLOTS = [
  '17:00', '17:15', '17:30', '17:45',
  '18:00', '18:15', '18:30', '18:45',
  '19:00', '19:15', '19:30', '19:45',
  '20:00', '20:15', '20:30', '20:45',
  '21:00', '21:15', '21:30', '21:45',
  '22:00'
];

export function TimeStepUI({ selectedTime, selectedDate, onTimeSelect }: TimeStepUIProps) {
  const [selected, setSelected] = useState(selectedTime);
  const slots = STUB_TIME_SLOTS;

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

  if (slots.length === 0) {
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
        {slots.map((time) => (
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
