
interface PaymentStepProps {
  amount: number;
  paymentRequired: boolean;
  bookingId: number;
  onComplete: (data: any) => void;
  onError: (error: string) => void;
  onBack: () => void;
}

export function PaymentStep({
  amount,
  paymentRequired,
  bookingId,
  onComplete,
  onError,
  onBack
}: PaymentStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Payment</h2>
      <div className="text-center py-8">
        <p className="text-muted-foreground">Payment processing - to be implemented</p>
      </div>
    </div>
  );
}
