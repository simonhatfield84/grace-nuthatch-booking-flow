
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CreditCard, Mail, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PaymentPendingIndicatorProps {
  booking: {
    id: number;
    status: string;
    created_at: string;
  };
  paymentRequest?: {
    id: string;
    expires_at: string;
    reminder_sent_at: string | null;
    status: string;
  };
  onResendRequest?: () => void;
  onSkipPayment?: () => void;
}

export const PaymentPendingIndicator = ({ 
  booking, 
  paymentRequest, 
  onResendRequest,
  onSkipPayment 
}: PaymentPendingIndicatorProps) => {
  if (booking.status !== 'pending_payment') {
    return null;
  }

  const isExpired = paymentRequest && new Date(paymentRequest.expires_at) < new Date();
  const timeUntilExpiry = paymentRequest 
    ? formatDistanceToNow(new Date(paymentRequest.expires_at), { addSuffix: true })
    : null;

  return (
    <div className="border-l-4 border-amber-500 bg-amber-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600" />
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            Payment Pending
          </Badge>
          {isExpired && (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Expired
            </Badge>
          )}
        </div>
        
        {timeUntilExpiry && !isExpired && (
          <span className="text-sm text-amber-600">
            Expires {timeUntilExpiry}
          </span>
        )}
      </div>

      <div className="text-sm text-amber-700">
        {isExpired 
          ? "Payment request has expired. Guest needs a new payment link."
          : paymentRequest?.reminder_sent_at
            ? "Payment request sent. Reminder already sent."
            : "Waiting for guest to complete payment."
        }
      </div>

      <div className="flex gap-2">
        {(isExpired || !paymentRequest) && onResendRequest && (
          <Button size="sm" variant="outline" onClick={onResendRequest}>
            <Mail className="h-3 w-3 mr-1" />
            {isExpired ? 'Send New Request' : 'Resend Request'}
          </Button>
        )}
        
        {!isExpired && paymentRequest && !paymentRequest.reminder_sent_at && (
          <Button size="sm" variant="outline" onClick={onResendRequest}>
            <Clock className="h-3 w-3 mr-1" />
            Send Reminder
          </Button>
        )}

        {onSkipPayment && (
          <Button size="sm" variant="ghost" onClick={onSkipPayment}>
            <CreditCard className="h-3 w-3 mr-1" />
            Skip Payment
          </Button>
        )}
      </div>
    </div>
  );
};
