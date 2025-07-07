
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, CreditCard } from "lucide-react";

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
    switch (payment.status) {
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
    switch (payment.status) {
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
    switch (payment.status) {
      case 'succeeded':
        return 'Payment Successful';
      case 'failed':
        return 'Payment Failed';
      case 'pending':
        return 'Payment Pending';
      case 'cancelled':
        return 'Payment Cancelled';
      default:
        return 'Unknown Status';
    }
  };

  return (
    <div className="space-y-2">
      <Badge variant={getStatusVariant()} className="flex items-center gap-1 w-fit">
        {getStatusIcon()}
        {getStatusText()}
      </Badge>
      
      <div className="text-sm text-muted-foreground">
        <p>Amount: £{(payment.amount_cents / 100).toFixed(2)}</p>
        {payment.payment_method_type && (
          <p>Method: {payment.payment_method_type}</p>
        )}
        {payment.failure_reason && (
          <p className="text-destructive">Reason: {payment.failure_reason}</p>
        )}
      </div>
    </div>
  );
};
