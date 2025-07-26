
interface DateTimeStepProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  partySize: number;
  onComplete: (data: any) => void;
  onError: (error: string) => void;
}

export function DateTimeStep({
  selectedDate,
  selectedTime,
  partySize,
  onComplete,
  onError
}: DateTimeStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Select Date & Time</h2>
      <div className="text-center py-8">
        <p className="text-muted-foreground">Date & Time selection - to be implemented</p>
      </div>
    </div>
  );
}
