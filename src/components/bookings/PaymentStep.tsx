
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, AlertCircle, RefreshCw } from "lucide-react";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentStepProps {
  amount: number;
  description: string;
  bookingId?: number;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
  onSkip?: () => void;
}

export const PaymentStep = ({
  amount,
  description,
  bookingId,
  onPaymentSuccess,
  onPaymentError,
  onSkip
}: PaymentStepProps) => {
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [showRetryMessage, setShowRetryMessage] = useState(false);

  // Auto-check payment status every 5 seconds if we have a booking ID
  useEffect(() => {
    if (!bookingId) return;

    const checkPaymentStatus = async () => {
      try {
        const { data: booking } = await supabase
          .from('bookings')
          .select('status')
          .eq('id', bookingId)
          .single();

        if (booking?.status === 'confirmed') {
          console.log('✅ Payment confirmed via auto-check for booking:', bookingId);
          onPaymentSuccess();
          return;
        }

        // Show retry message after 30 seconds
        setTimeout(() => setShowRetryMessage(true), 30000);
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    };

    // Check immediately, then every 5 seconds
    checkPaymentStatus();
    const interval = setInterval(checkPaymentStatus, 5000);

    return () => clearInterval(interval);
  }, [bookingId, onPaymentSuccess]);

  const handleManualStatusCheck = async () => {
    if (!bookingId) return;

    setIsCheckingStatus(true);
    try {
      console.log('🔍 Manually checking payment status for booking:', bookingId);

      const { data: booking } = await supabase
        .from('bookings')
        .select('status')
        .eq('id', bookingId)
        .single();

      const { data: payment } = await supabase
        .from('booking_payments')
        .select('status, processed_at')
        .eq('booking_id', bookingId)
        .single();

      console.log('📋 Booking status:', booking?.status, 'Payment status:', payment?.status);

      if (booking?.status === 'confirmed' && payment?.status === 'succeeded') {
        toast.success('Payment confirmed!');
        onPaymentSuccess();
      } else if (payment?.status === 'failed') {
        toast.error('Payment failed. Please try again.');
        onPaymentError('Payment failed');
      } else {
        toast.info('Payment is still processing. Please wait a moment...');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      toast.error('Error checking payment status');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900">
      <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
        <CardTitle className="text-2xl text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Payment Required
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          Complete your booking by processing payment
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4 bg-white dark:bg-gray-900">
        <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{description}</p>
            {bookingId && (
              <p className="text-sm text-muted-foreground">Booking ID: {bookingId}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">£{amount.toFixed(2)}</p>
          </div>
        </div>

        {showRetryMessage && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex flex-col gap-2">
                <p>Payment processing is taking longer than usual. This can happen due to payment verification delays.</p>
                <Button 
                  onClick={handleManualStatusCheck}
                  disabled={isCheckingStatus}
                  variant="outline" 
                  size="sm"
                  className="w-fit"
                >
                  {isCheckingStatus ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Check Payment Status
                    </>
                  )}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your payment will be processed securely through Stripe. The booking will be confirmed automatically once payment is verified.
          </AlertDescription>
        </Alert>

        {bookingId ? (
          <PaymentForm
            bookingId={bookingId}
            amount={amount}
            description={description}
            onPaymentSuccess={onPaymentSuccess}
            onPaymentError={onPaymentError}
          />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your booking will be created and then you'll be redirected to complete payment.
            </p>
            <div className="flex gap-2">
              <Button onClick={onPaymentSuccess} className="flex-1">
                Continue to Payment
              </Button>
              {onSkip && (
                <Button variant="outline" onClick={onSkip}>
                  Skip Payment
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
