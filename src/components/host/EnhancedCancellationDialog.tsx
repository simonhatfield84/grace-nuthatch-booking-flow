
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { differenceInHours } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

interface EnhancedCancellationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: number;
    booking_date: string;
    booking_time: string;
    service: string;
    venue_id: string;
    guest_name: string;
  };
  payment?: {
    id: string;
    amount_cents: number;
    stripe_payment_intent_id: string;
  };
  onCancellationComplete: () => void;
}

export const EnhancedCancellationDialog = ({
  open,
  onOpenChange,
  booking,
  payment,
  onCancellationComplete
}: EnhancedCancellationDialogProps) => {
  const [refundOption, setRefundOption] = useState<'full' | 'partial' | 'none'>('full');
  const [partialAmount, setPartialAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEntitledToRefund, setIsEntitledToRefund] = useState(false);
  const [refundWindow, setRefundWindow] = useState(24);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open && booking) {
      checkRefundEntitlement();
      // Reset form when dialog opens
      setNotes("");
      setValidationError(null);
      setError(null);
    }
  }, [open, booking]);

  // Clear validation error when notes change
  useEffect(() => {
    if (validationError && notes.trim()) {
      setValidationError(null);
    }
  }, [notes, validationError]);

  const checkRefundEntitlement = async () => {
    try {
      // Get service refund settings
      const { data: service } = await supabase
        .from('services')
        .select('refund_window_hours')
        .eq('title', booking.service)
        .single();

      const windowHours = service?.refund_window_hours || 24;
      setRefundWindow(windowHours);

      // Check if within refund window
      const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
      const hoursUntilBooking = differenceInHours(bookingDateTime, new Date());
      
      setIsEntitledToRefund(hoursUntilBooking >= windowHours);
    } catch (error) {
      console.error('Error checking refund entitlement:', error);
      setIsEntitledToRefund(false);
    }
  };

  const formatAmount = (pence: number) => `£${(pence / 100).toFixed(2)}`;

  const invalidateQueries = async () => {
    // Invalidate all relevant queries to refresh the UI
    await queryClient.invalidateQueries({
      queryKey: ['booking-payment', booking.id]
    });
    await queryClient.invalidateQueries({
      queryKey: ['booking-accurate-payment', booking.id]
    });
    await queryClient.invalidateQueries({
      queryKey: ['bookings']
    });
    await queryClient.invalidateQueries({
      queryKey: ['booking', booking.id]
    });
  };

  const validateForm = () => {
    // Reset errors
    setValidationError(null);
    setError(null);

    // Check if refund is selected but no reason provided
    if ((refundOption === 'full' || refundOption === 'partial') && !notes.trim()) {
      setValidationError('Refund reason is required when processing a refund');
      return false;
    }

    // Validate partial refund amount
    if (refundOption === 'partial') {
      const amount = parseFloat(partialAmount || '0');
      if (amount <= 0) {
        setError('Partial refund amount must be greater than 0');
        return false;
      }
      if (payment && amount > (payment.amount_cents / 100)) {
        setError('Partial refund amount cannot exceed the original payment');
        return false;
      }
    }

    return true;
  };

  const handleCancellation = async () => {
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('Starting cancellation process for booking:', booking.id);

      // Process refund if needed
      if (payment && refundOption !== 'none') {
        const refundAmount = refundOption === 'full' 
          ? payment.amount_cents 
          : Math.round(parseFloat(partialAmount || '0') * 100);

        console.log('Processing refund:', {
          payment_id: payment.id,
          refund_amount_cents: refundAmount,
          refund_reason: notes.trim(),
          booking_id: booking.id,
          venue_id: booking.venue_id
        });

        // Process refund through edge function
        const { data: refundResult, error: refundError } = await supabase.functions.invoke('process-refund', {
          body: {
            payment_id: payment.id,
            refund_amount_cents: refundAmount,
            refund_reason: notes.trim(),
            booking_id: booking.id,
            venue_id: booking.venue_id,
            override_window: !isEntitledToRefund
          }
        });

        console.log('Refund result:', refundResult);

        if (refundError) {
          console.error('Refund error:', refundError);
          setError(`Failed to process refund: ${refundError.message}`);
          return;
        }

        if (!refundResult?.success) {
          console.error('Refund failed:', refundResult);
          setError(`Refund failed: ${refundResult?.error || 'Unknown error'}`);
          return;
        }

        toast.success(`Refund of ${formatAmount(refundAmount)} processed successfully`);
      } else {
        // No payment or no refund - just cancel the booking
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id);

        if (bookingError) {
          console.error('Error updating booking:', bookingError);
          setError('Failed to cancel booking');
          return;
        }

        // Log cancellation in audit trail
        await supabase
          .from('booking_audit')
          .insert([{
            booking_id: booking.id,
            venue_id: booking.venue_id,
            change_type: 'status_change',
            field_name: 'status',
            old_value: 'confirmed',
            new_value: 'cancelled',
            notes: notes.trim() || 'Booking cancelled via host interface (no refund)'
          }]);

        toast.success('Booking cancelled successfully');
      }

      // Invalidate queries to refresh UI immediately
      await invalidateQueries();
      
      // Call the completion callback to refresh parent components
      onCancellationComplete();
      
      // Close dialog
      onOpenChange(false);

    } catch (error) {
      console.error('Error during cancellation:', error);
      setError(`Failed to cancel booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const maxRefundAmount = payment ? formatAmount(payment.amount_cents) : '0.00';

  // Determine if we need a refund reason or cancellation notes
  const isRefundSelected = refundOption === 'full' || refundOption === 'partial';
  const fieldLabel = isRefundSelected ? 'Refund Reason' : 'Cancellation Notes (Optional)';
  const fieldPlaceholder = isRefundSelected 
    ? 'e.g., Guest requested cancellation, schedule conflict, etc.' 
    : 'Add any additional notes about the cancellation...';

  // Check if form is valid for submission
  const isFormValid = !isProcessing && 
    (refundOption === 'none' || (isRefundSelected && notes.trim())) &&
    (refundOption !== 'partial' || (partialAmount && parseFloat(partialAmount) > 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Cancel Booking
          </DialogTitle>
          <DialogDescription>
            Cancel booking for {booking.guest_name} on {booking.booking_date} at {booking.booking_time}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Refund Entitlement Alert */}
          <Alert variant={isEntitledToRefund ? "default" : "destructive"}>
            {isEntitledToRefund ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription>
              {isEntitledToRefund 
                ? `This booking is entitled to a refund (${refundWindow}+ hours notice)`
                : `This booking is outside the ${refundWindow}-hour refund window`
              }
            </AlertDescription>
          </Alert>

          {/* Payment Information */}
          {payment && (
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-medium mb-2">Payment Details</h4>
              <p><span className="font-medium">Original Amount:</span> {maxRefundAmount}</p>
            </div>
          )}

          {/* Refund Options */}
          {payment ? (
            <div className="space-y-3">
              <Label className="text-base font-medium">Refund Option</Label>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="full-refund"
                    name="refund-option"
                    value="full"
                    checked={refundOption === 'full'}
                    onChange={(e) => setRefundOption(e.target.value as 'full')}
                    className="w-4 h-4"
                    disabled={isProcessing}
                  />
                  <label htmlFor="full-refund" className="flex items-center gap-2">
                    Full Refund ({maxRefundAmount})
                    {isEntitledToRefund && <Badge variant="secondary" className="text-xs">Entitled</Badge>}
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="partial-refund"
                    name="refund-option"
                    value="partial"
                    checked={refundOption === 'partial'}
                    onChange={(e) => setRefundOption(e.target.value as 'partial')}
                    className="w-4 h-4"
                    disabled={isProcessing}
                  />
                  <label htmlFor="partial-refund">Partial Refund</label>
                </div>

                {refundOption === 'partial' && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor="partial-amount">Refund Amount (£)</Label>
                    <Input
                      id="partial-amount"
                      type="number"
                      step="0.01"
                      max={payment.amount_cents / 100}
                      value={partialAmount}
                      onChange={(e) => setPartialAmount(e.target.value)}
                      placeholder="0.00"
                      disabled={isProcessing}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="no-refund"
                    name="refund-option"
                    value="none"
                    checked={refundOption === 'none'}
                    onChange={(e) => setRefundOption(e.target.value as 'none')}
                    className="w-4 h-4"
                    disabled={isProcessing}
                  />
                  <label htmlFor="no-refund">No Refund</label>
                </div>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                No payment found for this booking. The booking will be cancelled without any refund processing.
              </AlertDescription>
            </Alert>
          )}

          {/* Refund Reason / Cancellation Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-1">
              {fieldLabel}
              {isRefundSelected && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={fieldPlaceholder}
              rows={3}
              disabled={isProcessing}
              className={validationError ? "border-red-500 focus:border-red-500" : ""}
            />
            {validationError && (
              <p className="text-sm text-red-500">{validationError}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Keep Booking
            </Button>
            <Button 
              onClick={handleCancellation} 
              disabled={!isFormValid}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 animate-spin" />
                  Processing...
                </div>
              ) : (
                'Cancel Booking'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
