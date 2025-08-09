
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CreditCard, Lock, CheckCircle, AlertTriangle } from "lucide-react";
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

  // Verify payment status after completion
  const verifyPaymentStatus = async () => {
    setIsVerifyingPayment(true);
    console.log('🔍 Verifying payment status for booking:', bookingId);

    try {
      // First check if booking is already confirmed (primary indicator)
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('status')
        .eq('id', bookingId)
        .single();

      if (bookingError) {
        console.error('Error checking booking status:', bookingError);
        throw new Error('Failed to verify booking status');
      }

      console.log('📋 Booking status:', bookingData?.status);

      // If booking is confirmed, payment was successful
      if (bookingData?.status === 'confirmed') {
        console.log('✅ Booking is confirmed, payment successful');
        setPaymentCompleted(true);
        toast.success('Payment completed successfully!');
        
        // Auto-proceed after a short delay
        setTimeout(() => {
          onSuccess();
        }, 2000);
        return;
      }

      // Check payment status in our database as secondary verification
      const { data: paymentData, error: paymentError } = await supabase
        .from('booking_payments')
        .select('status, stripe_payment_intent_id')
        .eq('booking_id', bookingId)
        .single();

      if (paymentError && paymentError.code !== 'PGRST116') {
        console.error('Error checking payment status:', paymentError);
        throw new Error('Failed to verify payment status');
      }

      console.log('💰 Payment status:', paymentData);

      if (paymentData?.status === 'succeeded') {
        // Payment record exists and is succeeded, but booking might not be updated yet
        console.log('💰 Payment succeeded, updating booking status');
        
        // Update booking status to confirmed
        const { error: bookingUpdateError } = await supabase
          .from('bookings')
          .update({ status: 'confirmed' })
          .eq('id', bookingId);

        if (bookingUpdateError) {
          console.error('Error updating booking status:', bookingUpdateError);
        }

        // Send confirmation email
        await sendConfirmationEmail();
        
        setPaymentCompleted(true);
        toast.success('Payment completed successfully!');
        
        // Auto-proceed after a short delay
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else if (!paymentData) {
        // No payment record found, try manual reconciliation
        console.log('🔧 No payment record found, attempting reconciliation');
        
        try {
          const { data: reconcileData } = await supabase.functions.invoke('reconcile-payment', {
            body: { bookingId }
          });

          if (reconcileData?.success) {
            console.log('✅ Manual reconciliation successful');
            setPaymentCompleted(true);
            toast.success('Payment completed successfully!');
            
            setTimeout(() => {
              onSuccess();
            }, 2000);
          } else {
            throw new Error('Reconciliation failed');
          }
        } catch (reconcileError) {
          console.error('Reconciliation failed:', reconcileError);
          // Payment might still be processing, show message
          toast.info('Payment is being processed. Please wait...');
          
          // Retry verification after a delay
          setTimeout(() => {
            verifyPaymentStatus();
          }, 5000);
        }
      } else {
        // Payment might still be processing, show message
        toast.info('Payment is being processed. Please wait...');
        
        // Retry verification after a delay
        setTimeout(() => {
          verifyPaymentStatus();
        }, 3000);
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      setError('Payment verification failed. Please contact the venue if payment was deducted.');
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const sendConfirmationEmail = async () => {
    try {
      console.log('📧 Sending confirmation email for booking:', bookingId);
      
      // Get booking details to get guest email
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('email, venue_id')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking?.email) {
        console.log('No email found for booking, skipping email send');
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
        console.error('Email sending failed:', emailError);
      } else {
        console.log('✅ Confirmation email sent successfully');
      }
    } catch (error) {
      console.error('Error sending confirmation email:', error);
    }
  };

  const handlePaymentSuccess = () => {
    console.log('💳 Payment successful, verifying status...');
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
