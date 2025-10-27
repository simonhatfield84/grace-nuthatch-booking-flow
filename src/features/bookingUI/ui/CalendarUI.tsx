import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface CalendarUIProps {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  month?: Date;
  onMonthChange?: (date: Date) => void;
  className?: string;
}

export function CalendarUI({ 
  selected, 
  onSelect, 
  month,
  onMonthChange,
  className 
}: CalendarUIProps) {
  // Stub: All future dates are "available"
  const disabledDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today; // Only disable past dates
  };

  return (
    <div className="flex justify-center">
      <Calendar
        mode="single"
        selected={selected}
        onSelect={onSelect}
        month={month}
        onMonthChange={onMonthChange}
        disabled={disabledDates}
        className={cn("pointer-events-auto", className)}
      />
    </div>
  );
}
