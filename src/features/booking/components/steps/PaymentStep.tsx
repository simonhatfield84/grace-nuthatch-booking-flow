import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CreditCard, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentStepProps {
  amount: number;
  paymentRequired: boolean;
  onSuccess: () => void;
  onSkip?: () => void;
}

export function PaymentStep({ amount, paymentRequired, onSuccess, onSkip }: PaymentStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if payment is actually required
      if (!paymentRequired || amount <= 0) {
        onSuccess();
        return;
      }

      // Show error for unconfigured Stripe
      setError('Payment system is not configured. Please contact the venue directly.');
    } catch (err) {
      setError('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // If no payment required, auto-proceed
  if (!paymentRequired || amount <= 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-nuthatch-heading font-light text-nuthatch-dark mb-2">
            Booking Complete
          </h2>
          <p className="text-nuthatch-muted">
            No payment required for this booking
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

  const formatAmount = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-nuthatch-heading font-light text-nuthatch-dark mb-2">
          Secure Payment
        </h2>
        <p className="text-nuthatch-muted">
          Complete your booking with a secure payment
        </p>
      </div>

      <Card className="p-6 bg-nuthatch-light border-nuthatch-border">
        <div className="flex items-center justify-between mb-4">
          <span className="text-nuthatch-dark">Booking Total:</span>
          <span className="text-2xl font-bold text-nuthatch-dark">
            £{formatAmount(amount)}
          </span>
        </div>
        <p className="text-sm text-nuthatch-muted">
          This payment secures your reservation at The Nuthatch
        </p>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            Payment system is not currently configured. Please contact the venue directly at{' '}
            <a href="tel:+44123456789" className="text-nuthatch-green underline">
              +44 123 456 789
            </a>{' '}
            to complete your booking and arrange payment.
          </AlertDescription>
        </Alert>

        {onSkip && (
          <Button
            onClick={onSkip}
            variant="outline"
            className="w-full border-nuthatch-border text-nuthatch-dark hover:bg-nuthatch-light"
            size="lg"
          >
            Continue Without Payment (Contact Venue)
          </Button>
        )}

        <div className="flex items-center space-x-2 text-sm text-nuthatch-muted justify-center">
          <Lock className="h-4 w-4" />
          <span>Your booking will be held for 24 hours</span>
        </div>

        <p className="text-xs text-center text-nuthatch-muted">
          By continuing, you agree to contact the venue within 24 hours to arrange payment
        </p>
      </div>
    </div>
  );
}