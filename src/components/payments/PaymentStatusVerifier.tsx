
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, CheckCircle, AlertTriangle, Clock, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { reconcilePayment, checkPaymentConsistency } from "@/utils/paymentReconciliation";

interface PaymentStatusVerifierProps {
  bookingId: number;
  initialPaymentData?: any;
  onStatusUpdate?: (status: string) => void;
}

export const PaymentStatusVerifier = ({ 
  bookingId, 
  initialPaymentData,
  onStatusUpdate 
}: PaymentStatusVerifierProps) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [paymentData, setPaymentData] = useState(initialPaymentData);
  const [bookingData, setBookingData] = useState<any>(null);
  const [lastVerified, setLastVerified] = useState<Date | null>(null);
  const [consistencyIssue, setConsistencyIssue] = useState<string | null>(null);

  const verifyPaymentStatus = async () => {
    setIsVerifying(true);
    
    try {
      console.log('🔍 Verifying payment status for booking:', bookingId);

      // Get current payment data from database
      const { data: dbPayment } = await supabase
        .from('booking_payments')
        .select('*')
        .eq('booking_id', bookingId)
        .single();

      // Get current booking data
      const { data: dbBooking } = await supabase
        .from('bookings')
        .select('status')
        .eq('id', bookingId)
        .single();

      if (!dbPayment) {
        toast.info('No payment record found for this booking');
        return;
      }

      setPaymentData(dbPayment);
      setBookingData(dbBooking);
      setLastVerified(new Date());

      // Check for consistency issues
      const consistencyCheck = await checkPaymentConsistency(bookingId);
      if (!consistencyCheck.consistent) {
        setConsistencyIssue(consistencyCheck.reason);
        console.warn('⚠️ Payment consistency issue detected:', consistencyCheck.reason);
      } else {
        setConsistencyIssue(null);
      }

      // If payment is still pending, try to verify with Stripe directly
      if (dbPayment.status === 'pending' && dbPayment.stripe_payment_intent_id) {
        console.log('💳 Payment pending, checking with Stripe...');
        
        // Call edge function to verify payment intent status
        const { data: stripeData, error } = await supabase.functions.invoke('verify-payment-status', {
          body: {
            payment_intent_id: dbPayment.stripe_payment_intent_id,
            booking_id: bookingId
          }
        });

        if (error) {
          console.error('Stripe verification error:', error);
          toast.error('Failed to verify payment with Stripe');
          return;
        }

        if (stripeData?.payment_succeeded) {
          console.log('✅ Stripe confirms payment succeeded, reconciling...');
          
          await reconcilePayment({
            bookingId,
            paymentIntentId: dbPayment.stripe_payment_intent_id,
            amountCents: dbPayment.amount_cents,
            stripeStatus: 'succeeded'
          });

          // Refresh payment data
          const { data: updatedPayment } = await supabase
            .from('booking_payments')
            .select('*')
            .eq('booking_id', bookingId)
            .single();

          const { data: updatedBooking } = await supabase
            .from('bookings')
            .select('status')
            .eq('id', bookingId)
            .single();

          setPaymentData(updatedPayment);
          setBookingData(updatedBooking);
          setConsistencyIssue(null);
          onStatusUpdate?.('succeeded');
        }
      }

      toast.success('Payment status verified');
      
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Failed to verify payment status');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualReconciliation = async () => {
    if (!paymentData?.stripe_payment_intent_id) {
      toast.error('No payment intent ID found');
      return;
    }

    setIsReconciling(true);
    try {
      await reconcilePayment({
        bookingId,
        paymentIntentId: paymentData.stripe_payment_intent_id,
        amountCents: paymentData.amount_cents,
        stripeStatus: 'succeeded'
      });

      // Refresh data after reconciliation
      await verifyPaymentStatus();
    } catch (error) {
      console.error('Manual reconciliation error:', error);
      toast.error('Manual reconciliation failed');
    } finally {
      setIsReconciling(false);
    }
  };

  const getStatusDisplay = () => {
    if (!paymentData) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          No Payment Required
        </Badge>
      );
    }

    // Handle consistency issues
    if (consistencyIssue) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Status Mismatch
        </Badge>
      );
    }

    switch (paymentData.status) {
      case 'succeeded':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Payment Complete
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Payment Failed
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Payment Processing
          </Badge>
        );
    }
  };

  const getConsistencyIssueMessage = () => {
    switch (consistencyIssue) {
      case 'booking_confirmed_payment_not_succeeded':
        return 'Booking is confirmed but payment status is not succeeded';
      case 'payment_succeeded_booking_not_confirmed':
        return 'Payment succeeded but booking is not confirmed';
      case 'missing_processed_timestamp':
        return 'Payment succeeded but missing processing timestamp';
      default:
        return 'Payment and booking status are inconsistent';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {getStatusDisplay()}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={verifyPaymentStatus}
            disabled={isVerifying}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isVerifying ? 'animate-spin' : ''}`} />
            {isVerifying ? 'Verifying...' : 'Refresh Status'}
          </Button>
          
          {consistencyIssue && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualReconciliation}
              disabled={isReconciling}
            >
              <Wrench className={`h-4 w-4 mr-2 ${isReconciling ? 'animate-spin' : ''}`} />
              {isReconciling ? 'Fixing...' : 'Fix Status'}
            </Button>
          )}
        </div>
      </div>

      {consistencyIssue && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Status Inconsistency:</strong> {getConsistencyIssueMessage()}
            <br />
            Use the "Fix Status" button to reconcile automatically.
          </AlertDescription>
        </Alert>
      )}

      {paymentData?.status === 'pending' && !consistencyIssue && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your payment may still be processing. If this status doesn't update in a few minutes,
            please contact the venue directly or use the refresh button above.
          </AlertDescription>
        </Alert>
      )}

      {paymentData && (
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Amount: £{(paymentData.amount_cents / 100).toFixed(2)}</p>
          {paymentData.payment_method_type && (
            <p>Method: {paymentData.payment_method_type}</p>
          )}
          {paymentData.processed_at && (
            <p>Processed: {new Date(paymentData.processed_at).toLocaleString()}</p>
          )}
          {bookingData && (
            <p>Booking Status: <span className="font-medium">{bookingData.status}</span></p>
          )}
          {lastVerified && (
            <p>Last verified: {lastVerified.toLocaleTimeString()}</p>
          )}
        </div>
      )}
    </div>
  );
};
