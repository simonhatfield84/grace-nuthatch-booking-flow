import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CreditCard, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StripeProvider } from "@/components/providers/StripeProvider";
import { StripeCardForm } from "@/components/payments/StripeCardForm";

interface PaymentStepProps {
  amount: number;
  paymentRequired: boolean;
  onSuccess: () => void;
  bookingId: number;
  description?: string;
}

export function PaymentStep({ amount, paymentRequired, onSuccess, bookingId, description }: PaymentStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Create payment intent when component mounts
  useEffect(() => {
    if (!paymentRequired || amount <= 0 || !bookingId) {
      return;
    }

    const createPaymentIntent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('Creating payment intent for booking:', bookingId, 'amount:', amount);

        const { data, error: paymentError } = await supabase.functions.invoke('create-payment-intent', {
          body: {
            bookingId: bookingId,
            amount: amount,
            currency: 'gbp',
            description: description || 'Booking payment'
          }
        });

        if (paymentError) {
          console.error('Payment intent error:', paymentError);
          throw new Error('Failed to initialize payment. Please try again.');
        }

        if (!data?.client_secret) {
          console.error('No client secret returned:', data);
          throw new Error('Payment system error. Please contact the venue.');
        }

        console.log('Payment intent created successfully:', data);
        setClientSecret(data.client_secret);

      } catch (err) {
        console.error('Payment setup error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [bookingId, amount, paymentRequired, description]);

  const handlePaymentSuccess = () => {
    toast.success('Payment completed successfully!');
    onSuccess();
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
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

  const formatAmount = (pence: number) => {
    return (pence / 100).toFixed(2);
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

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Setting up secure payment...</span>
        </div>
      ) : clientSecret ? (
        <StripeProvider>
          <StripeCardForm
            clientSecret={clientSecret}
            amount={amount}
            description={description || `Booking payment for booking ${bookingId}`}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </StripeProvider>
      ) : (
        <div className="text-center py-8">
          <p className="text-nuthatch-muted">Failed to initialize payment system</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}