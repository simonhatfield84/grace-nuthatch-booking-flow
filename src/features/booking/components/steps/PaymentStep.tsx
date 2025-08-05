
import { Button } from "@/components/ui/button";

interface PaymentStepProps {
  amount: number;
  paymentRequired: boolean;
  onSuccess: () => void;
  bookingId: number;
  description?: string;
}

export function PaymentStep({ onSuccess }: PaymentStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-nuthatch-heading font-light text-nuthatch-dark mb-2">
          Booking Complete
        </h2>
        <p className="text-nuthatch-muted">
          Your booking has been confirmed. No payment is required at this time.
        </p>
      </div>
      <Button
        onClick={onSuccess}
        className="w-full bg-nuthatch-green hover:bg-nuthatch-dark text-nuthatch-white"
        size="lg"
      >
        Complete Booking
      </Button>
    </div>
  );
}
