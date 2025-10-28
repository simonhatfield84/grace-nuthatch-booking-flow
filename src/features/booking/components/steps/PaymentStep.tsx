
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CreditCard, Lock, CheckCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StripeProvider } from "@/components/providers/StripeProvider";
import { StripeCardForm } from "@/components/payments/StripeCardForm";
import { logger } from "@/lib/logger";

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
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  // Create payment intent when component mounts
  useEffect(() => {
    if (!paymentRequired || amount <= 0 || !bookingId) {
      return;
    }

    const createPaymentIntent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        logger.info('Creating payment intent for booking', { bookingId });
        logger.debug('Amount calculated server-side for security', { bookingId });

        // SECURITY: Only send bookingId - amount is calculated server-side
        const { data, error: paymentError } = await supabase.functions.invoke('create-payment-intent', {
          body: {
            bookingId: bookingId,
            idempotencyKey: `booking-${bookingId}-${Date.now()}`
          }
        });

        if (paymentError) {
          logger.error('Payment intent error', { error: paymentError.message, bookingId });
          
          // Handle specific error codes
          if (paymentError.message?.includes('unauthorized')) {
            throw new Error('Authentication required. Please refresh and try again.');
          } else if (paymentError.message?.includes('rate_limited')) {
            throw new Error('Too many payment requests. Please wait a moment and try again.');
          }
          
          throw new Error('Failed to initialize payment. Please try again.');
        }

        if (!data?.client_secret) {
          logger.error('No client secret returned', { data, bookingId });
          throw new Error('Payment system error. Please contact the venue.');
        }

        logger.info('Payment intent created', {
          paymentIntentId: data.payment_intent_id,
          amount: data.amount_cents,
          bookingId
        });
        
        setClientSecret(data.client_secret);

      } catch (err) {
        logger.error('Payment setup error', { error: err instanceof Error ? err.message : String(err), bookingId });
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [bookingId, amount, paymentRequired, description]);

  // Verify payment status after completion
  const verifyPaymentStatus = async () => {
    setIsVerifyingPayment(true);
    logger.debug('Verifying payment status for booking', { bookingId });

    try {
      // Check payment status in our database
      const { data: paymentData, error: paymentError } = await supabase
        .from('booking_payments')
        .select('status, stripe_payment_intent_id')
        .eq('booking_id', bookingId)
        .single();

      if (paymentError) {
        logger.error('Error checking payment status', { error: paymentError.message, bookingId });
        throw new Error('Failed to verify payment status');
      }

      logger.debug('Payment status', { paymentData, bookingId });

      if (paymentData?.status === 'succeeded') {
        // Update booking status to confirmed
        const { error: bookingUpdateError } = await supabase
          .from('bookings')
          .update({ status: 'confirmed' })
          .eq('id', bookingId);

        if (bookingUpdateError) {
          logger.error('Error updating booking status', { error: bookingUpdateError.message, bookingId });
        }

        // Send confirmation email
        await sendConfirmationEmail();
        
        setPaymentCompleted(true);
        toast.success('Payment completed successfully!');
        
        // Auto-proceed after a short delay
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        // Payment might still be processing, show message
        toast.info('Payment is being processed. Please wait...');
        
        // Retry verification after a delay
        setTimeout(() => {
          verifyPaymentStatus();
        }, 3000);
      }
    } catch (err) {
      logger.error('Payment verification error', { error: err instanceof Error ? err.message : String(err), bookingId });
      setError('Payment verification failed. Please contact the venue if payment was deducted.');
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const sendConfirmationEmail = async () => {
    try {
      logger.info('Sending confirmation email for booking', { bookingId });
      
      // Get booking details to get guest email
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('email, venue_id')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking?.email) {
        logger.warn('No email found for booking, skipping email send', { bookingId });
        return;
      }

      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          booking_id: bookingId,
          guest_email: booking.email,
          venue_id: booking.venue_id,
          email_type: 'booking_confirmation'
        }
      });

      if (emailError) {
        logger.error('Email sending failed', { error: emailError.message, bookingId });
      } else {
        logger.info('Confirmation email sent successfully', { bookingId });
      }
    } catch (error) {
      logger.error('Error sending confirmation email', { error: error instanceof Error ? error.message : String(error), bookingId });
    }
  };

  const handlePaymentSuccess = () => {
    logger.info('Payment successful, verifying status', { bookingId });
    verifyPaymentStatus();
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

  // Show payment completed state
  if (paymentCompleted) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-nuthatch-heading font-light text-nuthatch-dark mb-2">
            Payment Successful!
          </h2>
          <p className="text-nuthatch-muted">
            Your booking has been confirmed and you'll be redirected shortly
          </p>
        </div>
      </div>
    );
  }

  // Show payment verification state
  if (isVerifyingPayment) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-nuthatch-heading font-light text-nuthatch-dark mb-2">
            Verifying Payment
          </h2>
          <p className="text-nuthatch-muted">
            Please wait while we confirm your payment...
          </p>
        </div>
        
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This may take a few moments. Please don't close this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
