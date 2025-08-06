
import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Lock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  const [configurationError, setConfigurationError] = useState<string | null>(null);

  const cancelBookingOnError = async (reason: string) => {
    try {
      console.log('🚫 Cancelling booking due to payment error:', reason);
      
      // Get booking ID from client secret or description
      const bookingIdMatch = description.match(/booking (\d+)/);
      if (!bookingIdMatch) {
        console.error('Could not extract booking ID from description');
        return;
      }
      
      const bookingId = parseInt(bookingIdMatch[1]);
      
      // Cancel the booking
      const { error: cancelError } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (cancelError) {
        console.error('Error cancelling booking:', cancelError);
        return;
      }

      // Mark payment as failed
      const { error: paymentError } = await supabase
        .from('booking_payments')
        .update({ 
          status: 'failed',
          failure_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('booking_id', bookingId);

      if (paymentError) {
        console.error('Error updating payment status:', paymentError);
      }

      console.log('✅ Booking cancelled successfully due to payment error');
      
    } catch (error) {
      console.error('❌ Error in cancelBookingOnError:', error);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      const errorMsg = 'Payment system is not ready. Please refresh the page.';
      setConfigurationError(errorMsg);
      await cancelBookingOnError(errorMsg);
      toast.error(errorMsg);
      onError(errorMsg);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      const errorMsg = 'Card element not found. Please refresh the page.';
      setConfigurationError(errorMsg);
      await cancelBookingOnError(errorMsg);
      toast.error(errorMsg);
      onError(errorMsg);
      return;
    }

    setIsProcessing(true);
    setCardError(null);
    setPaymentDeclined(false);
    setConfigurationError(null);

    try {
      console.log('💳 Starting payment confirmation...');
      
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
        
        // Check for configuration errors
        if (error.type === 'api_connection_error' || error.code === 'api_key_invalid') {
          const configError = 'Payment system configuration error. Please contact the venue.';
          setConfigurationError(configError);
          await cancelBookingOnError(`Stripe configuration error: ${error.message}`);
          onError(configError);
          toast.error(configError);
          return;
        }

        // Check for declined payments
        const isDeclined = error.type === 'card_error' && 
          (error.decline_code || error.code === 'card_declined');
        
        if (isDeclined) {
          setPaymentDeclined(true);
          setCardError(null);
          // Don't cancel booking immediately for declined cards - give user chance to retry
        } else {
          // For other errors, cancel the booking
          setCardError(error.message || 'Payment failed');
          await cancelBookingOnError(error.message || 'Payment failed');
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
        await cancelBookingOnError(`Unexpected payment status: ${paymentIntent?.status}`);
        onError(errorMsg);
        toast.error(errorMsg);
      }
      
    } catch (err) {
      console.error('Payment error:', err);
      const errorMsg = 'An unexpected error occurred during payment';
      setConfigurationError(errorMsg);
      await cancelBookingOnError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

      {/* Configuration Error Alert */}
      {configurationError && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <div>
              <p className="font-medium text-red-800">Payment System Error</p>
              <p className="text-sm text-red-700">{configurationError}</p>
              <p className="text-sm text-red-600 mt-2">
                Your booking has been automatically cancelled. Please contact the venue directly to complete your reservation.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Card Input */}
      {!configurationError && (
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

          {cardError && !paymentDeclined && !configurationError && (
            <Alert variant="destructive">
              <AlertDescription>{cardError}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Security Notice */}
      {!configurationError && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
          <Lock className="h-4 w-4" />
          <span>Your payment information is secure and encrypted</span>
        </div>
      )}

      {/* Submit Button */}
      {!configurationError && (
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
      )}

      {!configurationError && (
        <p className="text-xs text-muted-foreground text-center">
          By completing your payment, you agree to our terms and conditions.
        </p>
      )}
    </form>
  );
};
