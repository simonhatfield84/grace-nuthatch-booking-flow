
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EnhancedCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: number;
    guest_name: string;
    venue_id: string;
    status: string;
  };
  onBookingUpdate: () => void;
}

export const EnhancedCancelDialog = ({ 
  open, 
  onOpenChange, 
  booking, 
  onBookingUpdate 
}: EnhancedCancelDialogProps) => {
  const [paymentData, setPaymentData] = useState<any>(null);
  const [cancelType, setCancelType] = useState<'no-refund' | 'full-refund' | 'partial-refund'>('no-refund');
  const [partialAmount, setPartialAmount] = useState('');
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadPaymentData();
    }
  }, [open, booking.id]);

  const loadPaymentData = async () => {
    try {
      const { data: payment } = await supabase
        .from('booking_payments')
        .select('*')
        .eq('booking_id', booking.id)
        .eq('status', 'succeeded')
        .maybeSingle();

      setPaymentData(payment);
      
      // If no payment exists, default to no-refund
      if (!payment) {
        setCancelType('no-refund');
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
    }
  };

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      // First, cancel the booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (bookingError) throw bookingError;

      // Log the cancellation in booking audit
      await supabase
        .from('booking_audit')
        .insert([{
          booking_id: booking.id,
          venue_id: booking.venue_id,
          change_type: 'booking_cancelled',
          field_name: 'status',
          old_value: booking.status,
          new_value: 'cancelled',
          notes: comment ? `Cancelled with comment: ${comment}` : 'Booking cancelled'
        }]);

      // Process refund if requested and payment exists
      if (paymentData && (cancelType === 'full-refund' || cancelType === 'partial-refund')) {
        // Calculate remaining refundable amount
        const alreadyRefunded = paymentData.refund_amount_cents || 0;
        const remainingRefundable = paymentData.amount_cents - alreadyRefunded;
        
        const refundAmount = cancelType === 'full-refund' 
          ? remainingRefundable // Refund only the remaining amount
          : Math.round(parseFloat(partialAmount) * 100);

        if (refundAmount > 0 && refundAmount <= remainingRefundable) {
          const { error: refundError } = await supabase.functions.invoke('process-refund', {
            body: {
              payment_id: paymentData.id,
              refund_amount_cents: refundAmount,
              refund_reason: `Booking cancellation - ${cancelType}`,
              booking_id: booking.id,
              venue_id: booking.venue_id,
              override_window: true
            }
          });

          if (refundError) {
            console.error('Refund processing error:', refundError);
            toast({
              title: "Partial Success",
              description: "Booking cancelled but refund failed. Please process refund manually.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Booking Cancelled & Refunded",
              description: `£${(refundAmount / 100).toFixed(2)} refund processed successfully`,
            });
          }
        }
      } else {
        toast({
          title: "Booking Cancelled",
          description: "Booking has been cancelled successfully",
        });
      }

      onBookingUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (pence: number) => `£${(pence / 100).toFixed(2)}`;
  
  // Calculate remaining refundable amount
  const alreadyRefunded = paymentData?.refund_amount_cents || 0;
  const remainingRefundable = paymentData ? paymentData.amount_cents - alreadyRefunded : 0;
  const maxRefundAmount = remainingRefundable / 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#292C2D] border-[#676767]/20 text-white rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-white font-inter flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#E47272]" />
            Cancel Booking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-[#111315] p-4 rounded-xl border border-[#676767]/20">
            <p className="text-sm text-white font-inter mb-2">
              Cancel booking for <strong>{booking.guest_name}</strong>
            </p>
            
            {paymentData && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-[#CCF0DB]">
                  <CreditCard className="h-4 w-4" />
                  <span>Original Payment: {formatAmount(paymentData.amount_cents)}</span>
                </div>
                {alreadyRefunded > 0 && (
                  <div className="text-sm text-[#F1C8D0]">
                    <span>Already Refunded: {formatAmount(alreadyRefunded)}</span>
                  </div>
                )}
                <div className="text-sm text-[#CCF0DB] font-medium">
                  <span>Available for Refund: {formatAmount(remainingRefundable)}</span>
                </div>
              </div>
            )}
          </div>

          {paymentData && remainingRefundable > 0 ? (
            <div>
              <Label className="text-white font-inter mb-3 block">Cancellation Options</Label>
              <RadioGroup value={cancelType} onValueChange={(value: any) => setCancelType(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no-refund" id="no-refund" className="border-[#676767] text-white" />
                  <Label htmlFor="no-refund" className="text-white font-inter text-sm">
                    Cancel without refund
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full-refund" id="full-refund" className="border-[#676767] text-white" />
                  <Label htmlFor="full-refund" className="text-white font-inter text-sm">
                    Cancel with full refund ({formatAmount(remainingRefundable)})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="partial-refund" id="partial-refund" className="border-[#676767] text-white" />
                  <Label htmlFor="partial-refund" className="text-white font-inter text-sm">
                    Cancel with partial refund
                  </Label>
                </div>
              </RadioGroup>

              {cancelType === 'partial-refund' && (
                <div className="mt-3">
                  <Label htmlFor="partial-amount" className="text-white font-inter text-sm">
                    Refund Amount (max £{maxRefundAmount.toFixed(2)})
                  </Label>
                  <Input
                    id="partial-amount"
                    type="number"
                    step="0.01"
                    max={maxRefundAmount}
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-[#676767]/20 border-[#676767]/30 text-white font-inter rounded-xl mt-1"
                  />
                </div>
              )}
            </div>
          ) : paymentData ? (
            <div className="text-sm text-[#676767] font-inter">
              No refund available - payment has already been fully refunded.
            </div>
          ) : (
            <div className="text-sm text-[#676767] font-inter">
              No payment found for this booking. Booking will be cancelled without refund.
            </div>
          )}

          <div>
            <Label htmlFor="comment" className="text-white font-inter mb-2 block">
              Optional Comment
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a reason for cancellation..."
              className="bg-[#676767]/20 border-[#676767]/30 text-white font-inter rounded-xl"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={() => onOpenChange(false)} 
              variant="outline" 
              className="flex-1 bg-[#676767]/20 text-white border-[#676767]/30 hover:bg-[#676767]/30 rounded-xl font-inter"
            >
              Keep Booking
            </Button>
            <Button 
              onClick={handleCancel} 
              disabled={isLoading}
              className="flex-1 bg-[#E47272] hover:bg-[#E47272]/80 text-white rounded-xl font-inter"
            >
              {isLoading ? 'Processing...' : 'Cancel Booking'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
