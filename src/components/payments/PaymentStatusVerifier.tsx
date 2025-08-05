
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { reconcilePayment } from "@/utils/paymentReconciliation";

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
  const [paymentData, setPaymentData] = useState(initialPaymentData);
  const [lastVerified, setLastVerified] = useState<Date | null>(null);

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

      if (!dbPayment) {
        toast.info('No payment record found for this booking');
        return;
      }

      setPaymentData(dbPayment);
      setLastVerified(new Date());

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

          setPaymentData(updatedPayment);
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

  const getStatusDisplay = () => {
    if (!paymentData) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          No Payment Required
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {getStatusDisplay()}
        <Button
          variant="outline"
          size="sm"
          onClick={verifyPaymentStatus}
          disabled={isVerifying}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isVerifying ? 'animate-spin' : ''}`} />
          {isVerifying ? 'Verifying...' : 'Refresh Status'}
        </Button>
      </div>

      {paymentData?.status === 'pending' && (
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
          {lastVerified && (
            <p>Last verified: {lastVerified.toLocaleTimeString()}</p>
          )}
        </div>
      )}
    </div>
  );
};
