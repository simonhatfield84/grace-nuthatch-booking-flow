
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, TrendingUp, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const PaymentAnalytics = () => {
  // Fetch payment metrics
  const { data: paymentMetrics, isLoading } = useQuery({
    queryKey: ["payment-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_payments")
        .select("*");

      if (error) throw error;

      // Calculate metrics
      const totalPayments = data.length;
      const successfulPayments = data.filter(p => p.status === "succeeded").length;
      const failedPayments = data.filter(p => p.status === "failed").length;
      const pendingPayments = data.filter(p => p.status === "pending").length;
      const totalRevenue = data
        .filter(p => p.status === "succeeded")
        .reduce((sum, p) => sum + (p.amount_cents || 0), 0);

      return {
        totalPayments,
        successfulPayments,
        failedPayments,
        pendingPayments,
        totalRevenue,
        successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
      };
    },
  });

  // Fetch failed bookings
  const { data: failedBookings } = useQuery({
    queryKey: ["failed-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .in("status", ["payment_failed", "expired", "pending_payment"])
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  // Fetch payment analytics events
  const { data: analyticsEvents } = useQuery({
    queryKey: ["payment-analytics-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_analytics")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 animate-spin" />
              <span>Loading payment analytics...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {/* Payment Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{((paymentMetrics?.totalRevenue || 0) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {paymentMetrics?.successfulPayments || 0} successful payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {paymentMetrics?.successRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {paymentMetrics?.successfulPayments} of {paymentMetrics?.totalPayments} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentMetrics?.failedPayments || 0}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentMetrics?.pendingPayments || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Failed Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payment Issues</CardTitle>
          <CardDescription>
            Bookings that failed payment or expired
          </CardDescription>
        </CardHeader>
        <CardContent>
          {failedBookings && failedBookings.length > 0 ? (
            <div className="space-y-3">
              {failedBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium">{booking.guest_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.booking_date} at {booking.booking_time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={
                        booking.status === "payment_failed" ? "destructive" :
                        booking.status === "expired" ? "secondary" : "outline"
                      }
                    >
                      {booking.status.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No payment issues found</p>
          )}
        </CardContent>
      </Card>

      {/* Payment Analytics Events */}
      {analyticsEvents && analyticsEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Payment Events</CardTitle>
            <CardDescription>
              System events and payment processing activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-2 border rounded text-sm"
                >
                  <div className="flex items-center space-x-2">
                    {event.event_type === 'payment_initiated' && <Clock className="h-3 w-3 text-blue-500" />}
                    {event.event_type === 'payment_succeeded' && <CheckCircle className="h-3 w-3 text-green-500" />}
                    {event.event_type === 'payment_failed' && <AlertTriangle className="h-3 w-3 text-red-500" />}
                    {event.event_type === 'payment_expired' && <Clock className="h-3 w-3 text-gray-500" />}
                    <div>
                      <span className="font-medium">Booking {event.booking_id}</span>
                      <span className="ml-2 text-muted-foreground">{event.event_type.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
