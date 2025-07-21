
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, AlertTriangle, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface BookingWithPayment {
  id: number;
  booking_reference: string;
  guest_name: string;
  email: string;
  status: string;
  booking_date: string;
  booking_time: string;
  payment: {
    status: string;
    amount_cents: number;
    stripe_payment_intent_id: string;
  } | null;
}

export const BookingStatusReconciliation = () => {
  const [isReconciling, setIsReconciling] = useState(false);

  const { data: bookingsWithPaymentIssues, isLoading, refetch } = useQuery({
    queryKey: ['bookings-payment-issues'],
    queryFn: async () => {
      // Get bookings with payment status mismatches
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_reference,
          guest_name,
          email,
          status,
          booking_date,
          booking_time,
          booking_payments!inner (
            status,
            amount_cents,
            stripe_payment_intent_id
          )
        `)
        .in('status', ['pending_payment', 'confirmed'])
        .gte('booking_date', new Date().toISOString().split('T')[0]);

      if (error) throw error;

      // Filter for mismatched statuses
      return bookings?.filter((booking: any) => {
        const payment = booking.booking_payments?.[0];
        if (!payment) return false;
        
        // Booking should be confirmed if payment succeeded
        if (payment.status === 'succeeded' && booking.status !== 'confirmed') {
          return true;
        }
        
        // Booking should be pending if payment is pending/failed
        if (payment.status !== 'succeeded' && booking.status === 'confirmed') {
          return true;
        }
        
        return false;
      }).map((booking: any) => ({
        ...booking,
        payment: booking.booking_payments?.[0] || null
      })) || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const reconcileBooking = async (booking: BookingWithPayment) => {
    try {
      const targetStatus = booking.payment?.status === 'succeeded' ? 'confirmed' : 'pending_payment';
      
      const { error } = await supabase
        .from('bookings')
        .update({ status: targetStatus })
        .eq('id', booking.id);

      if (error) throw error;

      // Send confirmation email if status changed to confirmed
      if (targetStatus === 'confirmed' && booking.email) {
        await supabase.functions.invoke('send-email', {
          body: {
            booking_id: booking.id,
            guest_email: booking.email,
            venue_id: '', // Will be fetched in function
            email_type: 'booking_confirmation'
          }
        });
      }

      toast.success(`Booking ${booking.booking_reference} reconciled successfully`);
      refetch();
    } catch (error) {
      console.error('Error reconciling booking:', error);
      toast.error(`Failed to reconcile booking ${booking.booking_reference}`);
    }
  };

  const reconcileAll = async () => {
    if (!bookingsWithPaymentIssues || bookingsWithPaymentIssues.length === 0) return;

    setIsReconciling(true);
    try {
      const promises = bookingsWithPaymentIssues.map(booking => reconcileBooking(booking));
      await Promise.all(promises);
      toast.success('All bookings reconciled successfully');
    } catch (error) {
      console.error('Error reconciling all bookings:', error);
      toast.error('Some bookings failed to reconcile');
    } finally {
      setIsReconciling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending_payment': return 'bg-yellow-100 text-yellow-800';
      case 'succeeded': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Booking Status Reconciliation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Booking Status Reconciliation
        </CardTitle>
        <CardDescription>
          Resolve payment and booking status mismatches. This helps when webhooks fail or payments are processed outside the normal flow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {bookingsWithPaymentIssues && bookingsWithPaymentIssues.length > 0 ? (
          <>
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Found {bookingsWithPaymentIssues.length} booking(s) with status mismatches
              </p>
              <Button 
                onClick={reconcileAll}
                disabled={isReconciling}
                size="sm"
              >
                {isReconciling ? 'Reconciling...' : 'Reconcile All'}
              </Button>
            </div>

            <div className="space-y-3">
              {bookingsWithPaymentIssues.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{booking.booking_reference}</h4>
                      <p className="text-sm text-muted-foreground">
                        {booking.guest_name} • {booking.booking_date} at {booking.booking_time}
                      </p>
                    </div>
                    <Button
                      onClick={() => reconcileBooking(booking)}
                      size="sm"
                      variant="outline"
                    >
                      Fix
                    </Button>
                  </div>

                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Booking Status:</span>
                      <Badge className={`ml-2 ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Payment Status:</span>
                      <Badge className={`ml-2 ${getStatusColor(booking.payment?.status || 'none')}`}>
                        {booking.payment?.status || 'none'}
                      </Badge>
                    </div>
                  </div>

                  {booking.payment && (
                    <div className="text-xs text-muted-foreground">
                      Amount: £{(booking.payment.amount_cents / 100).toFixed(2)} • 
                      Payment ID: {booking.payment.stripe_payment_intent_id}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-muted-foreground">
                      {booking.payment?.status === 'succeeded' && booking.status !== 'confirmed' 
                        ? 'Payment succeeded but booking not confirmed'
                        : 'Booking confirmed but payment not succeeded'
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-medium text-green-800 mb-2">All bookings are in sync</h3>
            <p className="text-sm text-muted-foreground">
              No payment and booking status mismatches found.
            </p>
          </div>
        )}

        <div className="pt-4 border-t">
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status Check
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
