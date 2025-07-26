
interface ConfirmationStepProps {
  bookingData: any;
  onComplete: (data: any) => void;
  onError: (error: string) => void;
  onBack: () => void;
}

export function ConfirmationStep({
  bookingData,
  onComplete,
  onError,
  onBack
}: ConfirmationStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Confirmation</h2>
      <div className="text-center py-8">
        <p className="text-muted-foreground">Booking confirmation - to be implemented</p>
      </div>
    </div>
  );
}
