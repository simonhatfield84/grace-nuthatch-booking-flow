
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertTriangle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { differenceInHours } from "date-fns";

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    id: string;
    booking_id: number;
    amount_cents: number;
    stripe_payment_intent_id: string;
  };
  booking: {
    id: number;
    booking_date: string;
    booking_time: string;
    service: string;
    venue_id: string;
  };
  onRefundProcessed: () => void;
}

export const RefundDialog = ({ 
  open, 
  onOpenChange, 
  payment, 
  booking, 
  onRefundProcessed 
}: RefundDialogProps) => {
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [serviceSettings, setServiceSettings] = useState<any>(null);

  useState(() => {
    if (open) {
      loadServiceSettings();
    }
  }, [open]);

  const loadServiceSettings = async () => {
    try {
      const { data: service } = await supabase
        .from('services')
        .select('refund_window_hours, auto_refund_enabled')
        .eq('title', booking.service)
        .single();
      
      setServiceSettings(service);
    } catch (error) {
      console.error('Error loading service settings:', error);
    }
  };

  const isWithinRefundWindow = () => {
    if (!serviceSettings) return true;
    
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
    const hoursUntilBooking = differenceInHours(bookingDateTime, new Date());
    
    return hoursUntilBooking >= serviceSettings.refund_window_hours;
  };

  const handleProcessRefund = async () => {
    setIsLoading(true);

    try {
      const amount = refundAmount ? Math.round(parseFloat(refundAmount) * 100) : payment.amount_cents;
      const reason = refundReason === 'other' ? customReason : refundReason;
      
      if (amount <= 0 || amount > payment.amount_cents) {
        toast.error('Please enter a valid refund amount');
        return;
      }

      if (!reason.trim()) {
        toast.error('Please provide a refund reason');
        return;
      }

      console.log('Processing refund:', {
        paymentId: payment.id,
        amount,
        reason
      });

      const { error } = await supabase.functions.invoke('process-refund', {
        body: {
          payment_id: payment.id,
          refund_amount_cents: amount,
          refund_reason: reason,
          booking_id: booking.id,
          venue_id: booking.venue_id,
          override_window: !isWithinRefundWindow()
        }
      });

      if (error) throw error;

      toast.success('Refund processed successfully!');
      onRefundProcessed();
      onOpenChange(false);

    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Failed to process refund');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (pence: number) => (pence / 100).toFixed(2);
  const maxRefundAmount = formatAmount(payment.amount_cents);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Process Refund
          </DialogTitle>
          <DialogDescription>
            Process a refund for this payment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-medium mb-2">Payment Details</h4>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Original Amount:</span> £{maxRefundAmount}</p>
              <p><span className="font-medium">Booking Date:</span> {booking.booking_date} at {booking.booking_time}</p>
              <p><span className="font-medium">Service:</span> {booking.service}</p>
            </div>
          </div>

          {!isWithinRefundWindow() && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This booking is outside the refund window ({serviceSettings?.refund_window_hours || 24} hours). 
                Processing this refund will require manager override.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="refund-amount">Refund Amount (£)</Label>
            <Input
              id="refund-amount"
              type="number"
              step="0.01"
              max={maxRefundAmount}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder={maxRefundAmount}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to refund the full amount (£{maxRefundAmount})
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="refund-reason">Refund Reason</Label>
            <Select value={refundReason} onValueChange={setRefundReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer_request">Customer Request</SelectItem>
                <SelectItem value="cancellation">Booking Cancelled</SelectItem>
                <SelectItem value="no_show">No Show Refund</SelectItem>
                <SelectItem value="venue_error">Venue Error</SelectItem>
                <SelectItem value="duplicate_payment">Duplicate Payment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {refundReason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason">Custom Reason</Label>
              <Textarea
                id="custom-reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please explain the reason for this refund..."
                rows={3}
              />
            </div>
          )}

          {serviceSettings?.auto_refund_enabled && isWithinRefundWindow() && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                This service has automatic refunds enabled. The refund will be processed immediately.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleProcessRefund} 
              disabled={isLoading || !refundReason || (refundReason === 'other' && !customReason.trim())}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isLoading ? 'Processing...' : 'Process Refund'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
