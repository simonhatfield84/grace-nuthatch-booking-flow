
interface DetailsStepProps {
  bookingData: any;
  onComplete: (data: any) => void;
  onError: (error: string) => void;
  onBack: () => void;
}

export function DetailsStep({
  bookingData,
  onComplete,
  onError,
  onBack
}: DetailsStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Your Details</h2>
      <div className="text-center py-8">
        <p className="text-muted-foreground">Guest details form - to be implemented</p>
      </div>
    </div>
  );
}
