import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Info } from "lucide-react";
import { useRefund } from "@/hooks/useRefund";

interface IndependentRefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    id: string;
    booking_id: number;
    amount_cents: number;
    refund_amount_cents?: number;
    stripe_payment_intent_id: string;
  };
  booking: {
    id: number;
    venue_id: string;
    guest_name: string;
    booking_date: string;
    booking_time: string;
  };
  onRefundProcessed: () => void;
}

export const IndependentRefundDialog = ({ 
  open, 
  onOpenChange, 
  payment, 
  booking, 
  onRefundProcessed 
}: IndependentRefundDialogProps) => {
  const [refundType, setRefundType] = useState<'full' | 'partial'>('partial');
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const { processRefund, isLoading } = useRefund();

  const alreadyRefunded = payment.refund_amount_cents || 0;
  const remainingRefundable = payment.amount_cents - alreadyRefunded;
  const maxRefundAmount = remainingRefundable / 100;

  const handleSubmit = async () => {
    const amount = refundType === 'full' 
      ? remainingRefundable 
      : Math.round(parseFloat(refundAmount) * 100);

    if (amount <= 0 || amount > remainingRefundable) {
      return;
    }

    if (!refundReason.trim()) {
      return;
    }

    const result = await processRefund({
      payment_id: payment.id,
      refund_amount_cents: amount,
      refund_reason: refundReason,
      booking_id: booking.id,
      venue_id: booking.venue_id,
      cancel_booking: false // This ensures booking status remains unchanged
    });

    if (result.success) {
      onRefundProcessed();
      onOpenChange(false);
      // Reset form
      setRefundType('partial');
      setRefundAmount("");
      setRefundReason("");
    }
  };

  const isValidAmount = refundType === 'full' || 
    (refundAmount && parseFloat(refundAmount) > 0 && parseFloat(refundAmount) <= maxRefundAmount);
  
  const canSubmit = isValidAmount && refundReason.trim().length > 0 && !isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Process Refund
          </DialogTitle>
          <DialogDescription>
            Issue a refund for this payment independently of booking cancellation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-medium mb-2">Payment Details</h4>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Original Amount:</span> £{(payment.amount_cents / 100).toFixed(2)}</p>
              {alreadyRefunded > 0 && (
                <p><span className="font-medium">Already Refunded:</span> £{(alreadyRefunded / 100).toFixed(2)}</p>
              )}
              <p><span className="font-medium">Available for Refund:</span> £{maxRefundAmount.toFixed(2)}</p>
              <p><span className="font-medium">Guest:</span> {booking.guest_name}</p>
              <p><span className="font-medium">Date:</span> {booking.booking_date} at {booking.booking_time}</p>
            </div>
          </div>

          {remainingRefundable <= 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This payment has already been fully refunded. No additional refund can be processed.
              </AlertDescription>
            </Alert>
          )}

          {remainingRefundable > 0 && (
            <>
              <div className="space-y-2">
                <Label>Refund Type</Label>
                <Select value={refundType} onValueChange={(value: 'full' | 'partial') => setRefundType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Refund - £{maxRefundAmount.toFixed(2)}</SelectItem>
                    <SelectItem value="partial">Partial Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {refundType === 'partial' && (
                <div className="space-y-2">
                  <Label htmlFor="refund-amount">Refund Amount (£) *</Label>
                  <Input
                    id="refund-amount"
                    type="number"
                    step="0.01"
                    max={maxRefundAmount}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum available: £{maxRefundAmount.toFixed(2)}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="refund-reason">Refund Reason *</Label>
                <Textarea
                  id="refund-reason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Please provide a detailed reason for this refund..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  This reason will be recorded in the audit trail and payment records.
                </p>
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {remainingRefundable > 0 && (
              <Button 
                onClick={handleSubmit} 
                disabled={!canSubmit}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {isLoading ? 'Processing...' : `Process ${refundType === 'full' ? 'Full' : 'Partial'} Refund`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
