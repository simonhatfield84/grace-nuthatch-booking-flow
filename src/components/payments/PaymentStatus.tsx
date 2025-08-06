import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, CreditCard, AlertTriangle, RefreshCw } from "lucide-react";
import { IndependentRefundDialog } from "@/components/host/IndependentRefundDialog";

interface PaymentStatusProps {
  bookingId: number;
  onRefundProcessed?: () => void;
}

export const PaymentStatus = ({ bookingId, onRefundProcessed }: PaymentStatusProps) => {
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: payment, isLoading } = useQuery({
    queryKey: ['booking-payment', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('booking_payments')
        .select('*')
        .eq('booking_id', bookingId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const { data: booking } = useQuery({
    queryKey: ['booking-details', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, venue_id, guest_name, booking_date, booking_time, status')
        .eq('id', bookingId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading payment status...</span>
      </div>
    );
  }

  if (!payment) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <CreditCard className="h-3 w-3" />
        No Payment Required
      </Badge>
    );
  }

  const getStatusIcon = () => {
    switch (payment?.status) {
      case 'succeeded':
        return <CheckCircle className="h-3 w-3" />;
      case 'failed':
        return <XCircle className="h-3 w-3" />;
      case 'pending':
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusVariant = () => {
    switch (payment?.status) {
      case 'succeeded':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'pending':
      default:
        return 'secondary';
    }
  };

  const getStatusText = () => {
    switch (payment?.status) {
      case 'succeeded':
        return 'Payment Successful';
      case 'failed':
        return 'Payment Failed';
      case 'pending':
        return 'Payment Pending';
      case 'cancelled':
        return 'Payment Cancelled';
      default:
        return 'Payment Required';
    }
  };

  const formatAmount = (pence: number) => `£${(pence / 100).toFixed(2)}`;

  const alreadyRefunded = payment.refund_amount_cents || 0;
  const remainingRefundable = payment.amount_cents - alreadyRefunded;
  const isFullyRefunded = remainingRefundable <= 0;
  const canRefund = payment.status === 'succeeded' && !isFullyRefunded;

  const handleRefundProcessed = async () => {
    // Invalidate all payment-related queries to ensure UI updates
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['booking-payment', bookingId] }),
      queryClient.invalidateQueries({ queryKey: ['booking-accurate-payment', bookingId] }),
      queryClient.invalidateQueries({ queryKey: ['booking-details', bookingId] }),
      queryClient.invalidateQueries({ queryKey: ['bookings'] }),
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] })
    ]);
    
    // Call the parent callback if provided
    if (onRefundProcessed) {
      onRefundProcessed();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Badge variant={getStatusVariant()} className="flex items-center gap-1">
          {getStatusIcon()}
          {getStatusText()}
        </Badge>
        
        {canRefund && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setRefundDialogOpen(true)}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Process Refund
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="text-sm">
          <p><strong>Original Amount:</strong> {formatAmount(payment.amount_cents)}</p>
          {payment?.payment_method_type && (
            <p><strong>Method:</strong> {payment.payment_method_type}</p>
          )}
          {payment?.failure_reason && (
            <p className="text-destructive"><strong>Reason:</strong> {payment.failure_reason}</p>
          )}
        </div>

        {/* Refund Information */}
        {alreadyRefunded > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Refund Information</span>
            </div>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Total Refunded:</strong> {formatAmount(alreadyRefunded)}</p>
              <p><strong>Refund Status:</strong> {
                payment.refund_status === 'full' ? 'Fully Refunded' :
                payment.refund_status === 'partial' ? 'Partially Refunded' :
                payment.refund_status === 'processing' ? 'Processing' :
                payment.refund_status === 'failed' ? 'Failed' :
                'Processed'
              }</p>
              {!isFullyRefunded && (
                <p><strong>Available for Refund:</strong> {formatAmount(remainingRefundable)}</p>
              )}
              {payment.refunded_at && (
                <p><strong>Last Refund:</strong> {new Date(payment.refunded_at).toLocaleDateString()}</p>
              )}
              {payment.refund_reason && (
                <p><strong>Reason:</strong> {payment.refund_reason}</p>
              )}
              {payment.stripe_refund_id && (
                <p className="text-xs text-blue-600"><strong>Refund ID:</strong> {payment.stripe_refund_id}</p>
              )}
              
              {/* Net Balance */}
              <div className="border-t border-blue-300 pt-2 mt-2">
                <p className="font-medium">
                  <strong>Net Balance:</strong> {formatAmount(payment.amount_cents - alreadyRefunded)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Independent Refund Dialog */}
      {booking && (
        <IndependentRefundDialog
          open={refundDialogOpen}
          onOpenChange={setRefundDialogOpen}
          payment={payment}
          booking={booking}
          onRefundProcessed={handleRefundProcessed}
        />
      )}
    </div>
  );
};
