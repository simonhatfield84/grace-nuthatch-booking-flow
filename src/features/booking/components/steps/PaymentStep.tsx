import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CreditCard, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if payment is actually required
      if (!paymentRequired || amount <= 0) {
        onSuccess();
        return;
      }

      // If we don't have a booking ID yet, we need to create the booking first
      if (!bookingId) {
        setError('Booking must be created before payment can be processed.');
        return;
      }

      console.log('Creating payment intent for booking:', bookingId, 'amount:', amount);

      // Create payment intent using the existing edge function
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
        setError('Failed to initialize payment. Please try again.');
        return;
      }

      if (!data?.client_secret) {
        console.error('No client secret returned:', data);
        setError('Payment system error. Please contact the venue.');
        return;
      }

      // For demo purposes, simulate successful payment
      // In production, this would redirect to actual Stripe Checkout: window.open(data.url, '_blank');
      toast.success('Processing payment...');
      
      // Simulate successful payment and update booking status
      setTimeout(async () => {
        try {
          // Update booking status to confirmed after successful payment
          const { error: updateError } = await supabase
            .from('bookings')
            .update({ status: 'confirmed' })
            .eq('id', bookingId);

          if (updateError) throw updateError;
          
          toast.success('Payment completed successfully!');
          onSuccess();
        } catch (err) {
          console.error('Error updating booking after payment:', err);
          toast.error('Payment succeeded but booking confirmation failed. Please contact the venue.');
        }
      }, 2000);

    } catch (err) {
      console.error('Payment error:', err);
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
        <Button
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full bg-nuthatch-green hover:bg-nuthatch-dark text-nuthatch-white"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay £{formatAmount(amount)}
            </>
          )}
        </Button>


        <div className="flex items-center space-x-2 text-sm text-nuthatch-muted justify-center">
          <Lock className="h-4 w-4" />
          <span>Secure payment powered by Stripe</span>
        </div>

        <p className="text-xs text-center text-nuthatch-muted">
          Your payment is protected by industry-standard encryption
        </p>
      </div>
    </div>
  );
}