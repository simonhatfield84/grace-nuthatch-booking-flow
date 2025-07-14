import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface StripeCardFormProps {
  clientSecret: string;
  amount: number;
  description: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const StripeCardForm = ({
  clientSecret,
  amount,
  description,
  onSuccess,
  onError,
}: StripeCardFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [paymentDeclined, setPaymentDeclined] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast.error('Payment system is not ready. Please refresh the page.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast.error('Card element not found. Please refresh the page.');
      return;
    }

    setIsProcessing(true);
    setCardError(null);
    setPaymentDeclined(false);

    try {
      // Confirm the payment with the card element
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'Guest', // Could be enhanced to collect actual name
          },
        },
      });

      if (error) {
        console.error('Payment failed:', error);
        const isDeclined = error.type === 'card_error' && 
          (error.decline_code || error.code === 'card_declined');
        
        if (isDeclined) {
          setPaymentDeclined(true);
          setCardError(null); // Clear generic error, we'll show declined message
        } else {
          setCardError(error.message || 'Payment failed');
        }
        
        onError(error.message || 'Payment failed');
      } else if (paymentIntent?.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent);
        toast.success('Payment completed successfully!');
        onSuccess();
      } else {
        console.error('Unexpected payment status:', paymentIntent?.status);
        const errorMsg = 'Payment was not completed successfully';
        setCardError(errorMsg);
        onError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Payment error:', err);
      const errorMsg = 'An unexpected error occurred during payment';
      setCardError(errorMsg);
      onError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (pence: number) => {
    return (pence / 100).toFixed(2);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Summary */}
      <div className="bg-muted/50 rounded-lg p-4 border">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium text-foreground">{description}</p>
            <p className="text-sm text-muted-foreground">Secure payment via Stripe</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">£{formatAmount(amount)}</p>
          </div>
        </div>
      </div>

      {/* Card Input */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Card Details
          </label>
          <div className="border rounded-lg p-3 bg-background">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: 'hsl(var(--foreground))',
                    fontFamily: 'system-ui, sans-serif',
                    '::placeholder': {
                      color: 'hsl(var(--muted-foreground))',
                    },
                  },
                  invalid: {
                    color: 'hsl(var(--destructive))',
                  },
                },
                hidePostalCode: true,
              }}
              onChange={(event) => {
                setCardError(event.error ? event.error.message : null);
              }}
            />
          </div>
        </div>

        {paymentDeclined && (
          <Alert className="border-orange-200 bg-orange-50 text-orange-800">
            <AlertDescription className="space-y-3">
              <div>
                <p className="font-medium">Your booking has not been completed</p>
                <p className="text-sm">Your card was declined. Please check your card details and try again, or use a different payment method.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPaymentDeclined(false);
                  setCardError(null);
                }}
                className="w-full"
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {cardError && !paymentDeclined && (
          <Alert variant="destructive">
            <AlertDescription>{cardError}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Security Notice */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
        <Lock className="h-4 w-4" />
        <span>Your payment information is secure and encrypted</span>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || isProcessing || paymentDeclined}
        className="w-full h-12 text-base font-medium"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : paymentDeclined ? (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Update Payment Details
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 mr-2" />
            Pay £{formatAmount(amount)}
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        By completing your payment, you agree to our terms and conditions.
      </p>
    </form>
  );
};