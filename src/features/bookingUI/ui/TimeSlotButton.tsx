import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeSlotButtonProps {
  time: string;
  isSelected: boolean;
  onClick: () => void;
}

export function TimeSlotButton({ time, isSelected, onClick }: TimeSlotButtonProps) {
  const getEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = (hours + 2) % 24;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <Button
      variant={isSelected ? "default" : "outline"}
      onClick={onClick}
      className={cn(
        "relative h-auto py-3 px-4 flex flex-col items-center justify-center",
        isSelected && "bg-blue-500 hover:bg-blue-600 text-white"
      )}
    >
      <span className="text-sm font-medium">{time}</span>
      <span className="text-xs opacity-80">to {getEndTime(time)}</span>
      {isSelected && (
        <CheckCircle className="absolute top-1 right-1 h-4 w-4" />
      )}
    </Button>
  );
}
