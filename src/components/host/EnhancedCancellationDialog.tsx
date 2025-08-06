
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertTriangle, Clock, CheckCircle, XCircle, Shield } from "lucide-react";
import { RefundDialog } from "./RefundDialog";
import { useRefundEligibility } from "@/hooks/useRefundEligibility";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useBookingAudit } from "@/hooks/useBookingAudit";

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
    party_size: number;
    booking_reference: string;
  };
  onBookingCancelled: () => void;
}

export const EnhancedCancellationDialog = ({
  open,
  onOpenChange,
  booking,
  onBookingCancelled
}: EnhancedCancellationDialogProps) => {
  const [step, setStep] = useState<'review' | 'refund' | 'processing'>('review');
  const [cancellationReason, setCancellationReason] = useState('');
  const [selectedRefundOption, setSelectedRefundOption] = useState<'full' | 'partial' | 'none' | null>(null);
  const [payment, setPayment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);

  const { eligibility, isLoading: eligibilityLoading } = useRefundEligibility(
    booking.id,
    booking.booking_date,
    booking.booking_time,
    booking.service,
    booking.venue_id
  );

  const { logAudit } = useBookingAudit();

  useEffect(() => {
    const loadPaymentInfo = async () => {
      if (!open || !booking.id) return;

      try {
        const { data } = await supabase
          .from('booking_payments')
          .select('*')
          .eq('booking_id', booking.id)
          .eq('status', 'succeeded')
          .single();

        setPayment(data);
      } catch (error) {
        console.log('No payment found for booking:', error);
      }
    };

    if (open) {
      setStep('review');
      setSelectedRefundOption(null);
      setCancellationReason('');
      loadPaymentInfo();
    }
  }, [open, booking.id]);

  const handleCancelWithoutRefund = async () => {
    if (!cancellationReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    setIsLoading(true);
    try {
      // Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', booking.id);

      if (bookingError) throw bookingError;

      // Log the cancellation
      await logAudit({
        booking_id: booking.id,
        change_type: 'booking_cancelled',
        field_name: 'status',
        old_value: 'confirmed',
        new_value: 'cancelled',
        changed_by: 'staff',
        notes: `Cancelled without refund. Reason: ${cancellationReason}`,
        source_type: 'manual',
        source_details: {
          refund_declined: true,
          had_payment: !!payment,
          payment_amount: payment?.amount_cents || 0
        }
      });

      toast.success('Booking cancelled successfully');
      onBookingCancelled();
      onOpenChange(false);

    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefundOptionSelect = (option: 'full' | 'partial') => {
    if (!cancellationReason.trim()) {
      toast.error('Please provide a cancellation reason first');
      return;
    }

    setSelectedRefundOption(option);
    setShowRefundDialog(true);
  };

  const handleRefundProcessed = async () => {
    // The RefundDialog handles the refund, we just need to cancel the booking
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', booking.id);

      if (error) throw error;

      // Log the cancellation with refund
      await logAudit({
        booking_id: booking.id,
        change_type: 'booking_cancelled',
        field_name: 'status',
        old_value: 'confirmed',
        new_value: 'cancelled',
        changed_by: 'staff',
        notes: `Cancelled with refund. Reason: ${cancellationReason}`,
        source_type: 'manual',
        source_details: {
          refund_processed: true,
          refund_type: selectedRefundOption
        }
      });

      toast.success('Booking cancelled and refund processed');
      onBookingCancelled();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating booking after refund:', error);
      toast.error('Refund processed but failed to update booking status');
    } finally {
      setIsLoading(false);
    }
  };

  if (eligibilityLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Checking refund eligibility...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open && !showRefundDialog} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Cancel Booking
            </DialogTitle>
            <DialogDescription>
              Review the cancellation details and choose how to proceed with any refund.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Booking Summary */}
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-medium mb-2">Booking Details</h4>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Guest:</span> {booking.guest_name}</p>
                <p><span className="font-medium">Reference:</span> {booking.booking_reference}</p>
                <p><span className="font-medium">Date:</span> {booking.booking_date} at {booking.booking_time}</p>
                <p><span className="font-medium">Party Size:</span> {booking.party_size}</p>
                <p><span className="font-medium">Service:</span> {booking.service}</p>
              </div>
            </div>

            {/* Payment & Refund Eligibility */}
            {eligibility?.hasPayment ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Payment Status:</span>
                  <Badge variant="secondary">£{eligibility.paymentAmount.toFixed(2)} Paid</Badge>
                </div>

                <Alert variant={eligibility.isEligible ? "default" : "destructive"}>
                  <div className="flex items-center gap-2">
                    {eligibility.isEligible ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                    <AlertDescription>
                      {eligibility.eligibilityReason}
                    </AlertDescription>
                  </div>
                </Alert>

                {!eligibility.isEligible && eligibility.canStaffOverride && (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      As a staff member, you can override the refund policy for compassionate reasons or emergencies.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  No payment found for this booking - cancellation will not require any refund processing.
                </AlertDescription>
              </Alert>
            )}

            {/* Cancellation Reason */}
            <div className="space-y-2">
              <Label htmlFor="cancellation-reason">Cancellation Reason *</Label>
              <Textarea
                id="cancellation-reason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Please provide the reason for cancellation..."
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {eligibility?.hasPayment && (
                <>
                  {(eligibility.isEligible || eligibility.canStaffOverride) && (
                    <Button 
                      onClick={() => handleRefundOptionSelect('full')}
                      disabled={!cancellationReason.trim() || isLoading}
                      className="justify-start"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Cancel with Full Refund (£{eligibility.paymentAmount.toFixed(2)})
                      {!eligibility.isEligible && eligibility.canStaffOverride && (
                        <Badge variant="outline" className="ml-2">Staff Override</Badge>
                      )}
                    </Button>
                  )}

                  {eligibility.canStaffOverride && (
                    <Button 
                      variant="outline"
                      onClick={() => handleRefundOptionSelect('partial')}
                      disabled={!cancellationReason.trim() || isLoading}
                      className="justify-start"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Cancel with Partial Refund
                    </Button>
                  )}
                </>
              )}

              <Button 
                variant="outline"
                onClick={handleCancelWithoutRefund}
                disabled={!cancellationReason.trim() || isLoading}
                className="justify-start"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel without Refund
              </Button>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Keep Booking
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showRefundDialog && payment && (
        <RefundDialog
          open={showRefundDialog}
          onOpenChange={setShowRefundDialog}
          payment={payment}
          booking={booking}
          onRefundProcessed={handleRefundProcessed}
        />
      )}
    </>
  );
};
