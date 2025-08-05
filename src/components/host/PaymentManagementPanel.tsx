
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, RefreshCw, Receipt, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PaymentRequestDialog } from "./PaymentRequestDialog";
import { RefundDialog } from "./RefundDialog";
import { PaymentPendingIndicator } from "./PaymentPendingIndicator";

interface PaymentManagementPanelProps {
  booking: {
    id: number;
    guest_name: string;
    email: string;
    party_size: number;
    service: string;
    venue_id: string;
    booking_date: string;
    booking_time: string;
    status: string;
    created_at: string;
  };
}

export const PaymentManagementPanel = ({ booking }: PaymentManagementPanelProps) => {
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentRequestDialogOpen, setPaymentRequestDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPaymentData();
  }, [booking.id]);

  const loadPaymentData = async () => {
    try {
      // Load payment data from existing booking_payments table
      const { data: payment } = await supabase
        .from('booking_payments')
        .select('*')
        .eq('booking_id', booking.id)
        .maybeSingle();

      setPaymentData(payment);
    } catch (error) {
      console.error('Error loading payment data:', error);
    }
  };

  const handleSkipPayment = async () => {
    setIsLoading(true);
    try {
      // Update booking status to confirmed and log the skip
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking.id);

      if (error) throw error;

      // Log the skip in booking audit
      await supabase
        .from('booking_audit')
        .insert([{
          booking_id: booking.id,
          venue_id: booking.venue_id,
          change_type: 'payment_skipped',
          field_name: 'status',
          old_value: 'pending_payment',
          new_value: 'confirmed',
          notes: 'Payment requirement skipped by host'
        }]);

      await loadPaymentData();
    } catch (error) {
      console.error('Error skipping payment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentStatusBadge = () => {
    if (!paymentData) {
      return booking.status === 'pending_payment' 
        ? <Badge variant="secondary">Payment Required</Badge>
        : <Badge variant="outline">No Payment</Badge>;
    }

    switch (paymentData.status) {
      case 'succeeded':
        return <Badge className="bg-green-100 text-green-800">Payment Complete</Badge>;
      case 'pending':
        return <Badge variant="secondary">Payment Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Payment Failed</Badge>;
      default:
        return <Badge variant="outline">{paymentData.status}</Badge>;
    }
  };

  const formatAmount = (pence: number) => `£${(pence / 100).toFixed(2)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Management
          </span>
          {getPaymentStatusBadge()}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <PaymentPendingIndicator
          booking={booking}
          paymentRequest={null}
          onResendRequest={() => setPaymentRequestDialogOpen(true)}
          onSkipPayment={handleSkipPayment}
        />

        {paymentData && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Amount:</span> {formatAmount(paymentData.amount_cents)}
              </div>
              <div>
                <span className="font-medium">Status:</span> {paymentData.status}
              </div>
              <div>
                <span className="font-medium">Method:</span> {paymentData.payment_method_type || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Date:</span> {new Date(paymentData.created_at).toLocaleDateString()}
              </div>
            </div>

            {(paymentData.refund_amount_cents || 0) > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCw className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Refund Information</span>
                </div>
                <div className="text-sm text-blue-700">
                  <p>Amount: {formatAmount(paymentData.refund_amount_cents || 0)}</p>
                  <p>Status: {paymentData.refund_status || 'none'}</p>
                  {paymentData.refund_reason && (
                    <p>Reason: {paymentData.refund_reason}</p>
                  )}
                </div>
              </div>
            )}

            {paymentData.failure_reason && (
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800">Payment Failed</span>
                </div>
                <p className="text-sm text-red-700">{paymentData.failure_reason}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {!paymentData && booking.status !== 'pending_payment' && (
            <Button
              size="sm"
              onClick={() => setPaymentRequestDialogOpen(true)}
              disabled={isLoading}
            >
              <Receipt className="h-4 w-4 mr-2" />
              Request Payment
            </Button>
          )}

          {paymentData?.status === 'succeeded' && (paymentData.refund_status === 'none' || !paymentData.refund_status) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRefundDialogOpen(true)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Process Refund
            </Button>
          )}
        </div>

        <PaymentRequestDialog
          open={paymentRequestDialogOpen}
          onOpenChange={setPaymentRequestDialogOpen}
          booking={booking}
        />

        {paymentData && (
          <RefundDialog
            open={refundDialogOpen}
            onOpenChange={setRefundDialogOpen}
            payment={paymentData}
            booking={booking}
            onRefundProcessed={loadPaymentData}
          />
        )}
      </CardContent>
    </Card>
  );
};
