
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, CreditCard, AlertTriangle } from "lucide-react";

interface PaymentStatusProps {
  bookingId: number;
}

export const PaymentStatus = ({ bookingId }: PaymentStatusProps) => {
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

  // Get accurate payment amount by calculating from service
  const { data: accurateAmount } = useQuery({
    queryKey: ['booking-accurate-payment', bookingId],
    queryFn: async () => {
      // First get the booking details
      const { data: booking } = await supabase
        .from('bookings')
        .select('party_size, service')
        .eq('id', bookingId)
        .single();

      if (!booking?.service) return null;

      // Then get the service details by matching the service title
      const { data: serviceData } = await supabase
        .from('services')
        .select('requires_payment, charge_type, charge_amount_per_guest, minimum_guests_for_charge')
        .eq('title', booking.service)
        .single();

      if (serviceData?.requires_payment && serviceData.charge_type === 'per_guest') {
        const chargePerGuest = serviceData.charge_amount_per_guest || 0;
        const minGuests = serviceData.minimum_guests_for_charge || 1;
        const chargingPartySize = Math.max(booking.party_size, minGuests);
        return chargePerGuest * chargingPartySize;
      }

      return null;
    },
    enabled: !!bookingId
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading payment status...</span>
      </div>
    );
  }

  if (!payment && !accurateAmount) {
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

  // Use accurate amount if available, otherwise fall back to payment amount
  const displayAmount = accurateAmount || payment?.amount_cents;
  const isAmountCorrected = accurateAmount && payment?.amount_cents && accurateAmount !== payment.amount_cents;

  return (
    <div className="space-y-2">
      <Badge variant={getStatusVariant()} className="flex items-center gap-1 w-fit">
        {getStatusIcon()}
        {getStatusText()}
      </Badge>
      
      {displayAmount && (
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <p>Amount: £{(displayAmount / 100).toFixed(2)}</p>
            {isAmountCorrected && (
              <div className="flex items-center gap-1 text-blue-600" title="Amount corrected based on current service pricing">
                <AlertTriangle className="h-3 w-3" />
                <span className="text-xs">Corrected</span>
              </div>
            )}
          </div>
          {payment?.payment_method_type && (
            <p>Method: {payment.payment_method_type}</p>
          )}
          {payment?.failure_reason && (
            <p className="text-destructive">Reason: {payment.failure_reason}</p>
          )}
        </div>
      )}
    </div>
  );
};
