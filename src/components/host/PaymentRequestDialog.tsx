
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Mail, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculateEnhancedPaymentAmount } from "@/utils/enhancedPaymentCalculation";

interface PaymentRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: number;
    guest_name: string;
    email: string;
    party_size: number;
    service: string;
    venue_id: string;
    booking_date: string;
    booking_time: string;
  };
}

export const PaymentRequestDialog = ({ open, onOpenChange, booking }: PaymentRequestDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [paymentCalculation, setPaymentCalculation] = useState<any>(null);

  const calculatePayment = async () => {
    try {
      // Get service ID from service title
      const { data: service } = await supabase
        .from('services')
        .select('id')
        .eq('title', booking.service)
        .single();

      const calculation = await calculateEnhancedPaymentAmount(
        service?.id || null,
        booking.party_size,
        booking.venue_id
      );

      setPaymentCalculation(calculation);
    } catch (error) {
      console.error('Error calculating payment:', error);
    }
  };

  useState(() => {
    if (open && booking) {
      calculatePayment();
    }
  }, [open, booking]);

  const handleSendPaymentRequest = async () => {
    setIsLoading(true);

    try {
      const amount = customAmount ? Math.round(parseFloat(customAmount) * 100) : paymentCalculation?.amount || 0;
      
      if (amount <= 0) {
        toast.error('Please enter a valid payment amount');
        return;
      }

      console.log('Sending payment request:', {
        bookingId: booking.id,
        amount,
        guestEmail: booking.email,
        customMessage
      });

      const { error } = await supabase.functions.invoke('send-payment-request', {
        body: {
          booking_id: booking.id,
          amount_cents: amount,
          guest_email: booking.email,
          custom_message: customMessage,
          venue_id: booking.venue_id
        }
      });

      if (error) throw error;

      // Update booking status to pending payment
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'pending_payment' })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      toast.success('Payment request sent successfully!');
      onOpenChange(false);

    } catch (error) {
      console.error('Error sending payment request:', error);
      toast.error('Failed to send payment request');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (pence: number) => (pence / 100).toFixed(2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Request Payment
          </DialogTitle>
          <DialogDescription>
            Send a payment request to {booking.guest_name} for their booking
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-medium mb-2">Booking Details</h4>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Guest:</span> {booking.guest_name}</p>
              <p><span className="font-medium">Email:</span> {booking.email}</p>
              <p><span className="font-medium">Date:</span> {booking.booking_date} at {booking.booking_time}</p>
              <p><span className="font-medium">Party Size:</span> {booking.party_size}</p>
              <p><span className="font-medium">Service:</span> {booking.service}</p>
            </div>
          </div>

          {paymentCalculation?.shouldCharge && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Service requires payment: £{formatAmount(paymentCalculation.amount)} 
                ({paymentCalculation.description})
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount (£)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder={paymentCalculation ? formatAmount(paymentCalculation.amount) : "0.00"}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use the calculated amount
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Custom Message (Optional)</Label>
            <Textarea
              id="message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a personal message to the payment request..."
              rows={3}
            />
          </div>

          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Payment requests expire in 24 hours. A reminder will be sent 3 hours before expiry.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendPaymentRequest} disabled={isLoading}>
              <Mail className="h-4 w-4 mr-2" />
              {isLoading ? 'Sending...' : 'Send Payment Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
