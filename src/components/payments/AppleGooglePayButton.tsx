import { useState, useEffect } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface AppleGooglePayButtonProps {
  clientSecret: string;
  amount: number;
  description: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const AppleGooglePayButton = ({
  clientSecret,
  amount,
  description,
  onSuccess,
  onError,
}: AppleGooglePayButtonProps) => {
  const stripe = useStripe();
  const [isSupported, setIsSupported] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);

  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: 'GB',
      currency: 'gbp',
      total: {
        label: description,
        amount: amount,
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Check if Payment Request is supported
    pr.canMakePayment().then((result) => {
      if (result) {
        setIsSupported(true);
        setPaymentRequest(pr);
      }
    });

    pr.on('paymentmethod', async (event) => {
      setIsProcessing(true);
      
      try {
        // Confirm the payment with the payment method from Apple/Google Pay
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: event.paymentMethod.id,
          },
          { handleActions: false }
        );

        if (error) {
          console.error('Payment failed:', error);
          event.complete('fail');
          onError(error.message || 'Payment failed');
          toast.error(error.message || 'Payment failed');
        } else if (paymentIntent?.status === 'succeeded') {
          console.log('Payment succeeded:', paymentIntent);
          event.complete('success');
          toast.success('Payment completed successfully!');
          onSuccess();
        } else {
          console.error('Unexpected payment status:', paymentIntent?.status);
          event.complete('fail');
          const errorMsg = 'Payment was not completed successfully';
          onError(errorMsg);
          toast.error(errorMsg);
        }
      } catch (err) {
        console.error('Payment error:', err);
        event.complete('fail');
        const errorMsg = 'An unexpected error occurred during payment';
        onError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setIsProcessing(false);
      }
    });
  }, [stripe, clientSecret, amount, description, onSuccess, onError]);

  const handleClick = () => {
    if (paymentRequest) {
      paymentRequest.show();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleClick}
        disabled={!paymentRequest || isProcessing}
        className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium text-base"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Smartphone className="h-4 w-4 mr-2" />
            Pay with Apple Pay / Google Pay
          </>
        )}
      </Button>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>
    </div>
  );
};