
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertTriangle, Clock, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { differenceInHours } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [serviceSettings, setServiceSettings] = useState<any>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [requiresOverride, setRequiresOverride] = useState(false);

  useEffect(() => {
    if (open) {
      loadServiceSettings();
      checkStaffStatus();
    }
  }, [open]);

  const loadServiceSettings = async () => {
    try {
      const { data: service } = await supabase
        .from('services')
        .select('title, refund_window_hours, auto_refund_enabled')
        .eq('title', booking.service)
        .single();
      
      setServiceSettings({
        refund_window_hours: service?.refund_window_hours || 24,
        auto_refund_enabled: service?.auto_refund_enabled || false
      });
    } catch (error) {
      console.error('Error loading service settings:', error);
    }
  };

  const checkStaffStatus = async () => {
    try {
      const { data } = await supabase.rpc('is_admin', {
        _user_id: user?.id,
        _venue_id: booking.venue_id
      });
      setIsStaff(data || false);
    } catch (error) {
      console.error('Error checking staff status:', error);
      setIsStaff(false);
    }
  };

  const isWithinRefundWindow = () => {
    if (!serviceSettings) return true;
    
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
    const hoursUntilBooking = differenceInHours(bookingDateTime, new Date());
    
    return hoursUntilBooking >= (serviceSettings.refund_window_hours || 24);
  };

  const needsStaffOverride = () => {
    return !isWithinRefundWindow() && isStaff;
  };

  useEffect(() => {
    setRequiresOverride(needsStaffOverride());
  }, [serviceSettings, isStaff]);

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

      // Check if override is required and validate
      if (requiresOverride) {
        if (!overrideReason.trim()) {
          toast.error('Staff override reason is required for out-of-policy refunds');
          return;
        }
        if (!['emergency', 'bereavement', 'force_majeure', 'venue_discretion'].includes(overrideReason)) {
          toast.error('Please select a valid override reason');
          return;
        }
      }

      console.log('Processing refund:', {
        paymentId: payment.id,
        amount,
        reason,
        requiresOverride,
        overrideReason
      });

      const { error } = await supabase.functions.invoke('process-refund', {
        body: {
          payment_id: payment.id,
          refund_amount_cents: amount,
          refund_reason: reason,
          booking_id: booking.id,
          venue_id: booking.venue_id,
          override_window: requiresOverride,
          override_reason: overrideReason,
          staff_user_id: isStaff ? user?.id : null
        }
      });

      if (error) throw error;

      toast.success(requiresOverride ? 
        'Staff override refund processed successfully!' : 
        'Refund processed successfully!'
      );
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
            {requiresOverride && <Badge variant="outline" className="ml-2">Staff Override</Badge>}
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

          {requiresOverride && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                This booking is outside the standard refund window ({serviceSettings?.refund_window_hours || 24} hours). 
                As staff, you can override this policy for compassionate reasons.
              </AlertDescription>
            </Alert>
          )}

          {!isWithinRefundWindow() && !isStaff && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This booking is outside the refund window ({serviceSettings?.refund_window_hours || 24} hours).
                Only staff members can process out-of-policy refunds.
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

          {requiresOverride && (
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="override-reason">Staff Override Reason *</Label>
              <Select value={overrideReason} onValueChange={setOverrideReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select override reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emergency">Medical/Family Emergency</SelectItem>
                  <SelectItem value="bereavement">Bereavement</SelectItem>
                  <SelectItem value="force_majeure">Force Majeure (Travel disruption, etc.)</SelectItem>
                  <SelectItem value="venue_discretion">Venue Discretion (Good customer relations)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Required for out-of-policy refunds. This will be logged for management review.
              </p>
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
              disabled={
                isLoading || 
                !refundReason || 
                (refundReason === 'other' && !customReason.trim()) ||
                (requiresOverride && !overrideReason) ||
                (!isWithinRefundWindow() && !isStaff)
              }
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
