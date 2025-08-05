
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentFormProps {
  bookingId: number;
  amount: number;
  description: string;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
}

export const PaymentForm = ({ 
  bookingId, 
  amount, 
  description, 
  onPaymentSuccess, 
  onPaymentError 
}: PaymentFormProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Create payment intent
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          bookingId,
          amount,
          description,
          currency: 'gbp'
        }
      });

      if (error) throw error;

      if (data?.client_secret) {
        // In a real implementation, you would use Stripe Elements here
        // For now, we'll simulate the payment process
        toast({
          title: "Payment Initiated",
          description: "Redirecting to payment page...",
        });

        // Simulate successful payment after a delay
        setTimeout(() => {
          toast({
            title: "Payment Successful",
            description: "Your booking payment has been processed.",
          });
          onPaymentSuccess?.();
        }, 2000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error.message || 'Payment failed. Please try again.';
      
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      onPaymentError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Required
        </CardTitle>
        <CardDescription>
          Complete your booking by processing payment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
          <div>
            <p className="font-medium">{description}</p>
            <p className="text-sm text-muted-foreground">Booking ID: {bookingId}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">£{amount.toFixed(2)}</p>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This is a simplified payment interface. In production, this would integrate with Stripe Elements for secure card processing.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? "Processing Payment..." : `Pay £${amount.toFixed(2)}`}
        </Button>
      </CardContent>
    </Card>
  );
};
