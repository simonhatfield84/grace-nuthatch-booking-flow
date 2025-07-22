
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { TrendingUp, TrendingDown, Clock, CreditCard, AlertTriangle, CheckCircle } from "lucide-react";

interface PaymentAnalyticsData {
  total_bookings: number;
  confirmed_bookings: number;
  failed_bookings: number;
  expired_bookings: number;
  pending_bookings: number;
  conversion_rate: number;
  total_revenue_cents: number;
}

export const PaymentAnalytics = () => {
  // Fetch payment analytics summary
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["payment-analytics"],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("status, created_at, updated_at, party_size")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Calculate analytics
      const totalBookings = bookings.length;
      const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
      const failedBookings = bookings.filter(b => b.status === 'payment_failed').length;
      const expiredBookings = bookings.filter(b => b.status === 'expired').length;
      const pendingBookings = bookings.filter(b => b.status === 'pending_payment').length;
      const conversionRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;

      return {
        total_bookings: totalBookings,
        confirmed_bookings: confirmedBookings,
        failed_bookings: failedBookings,
        expired_bookings: expiredBookings,
        pending_bookings: pendingBookings,
        conversion_rate: conversionRate,
        total_revenue_cents: 0 // Would need to calculate from payment records
      } as PaymentAnalyticsData;
    },
  });

  // Fetch recent failed/expired bookings
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
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            {analytics?.conversion_rate >= 80 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.conversion_rate?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {analytics?.confirmed_bookings || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {analytics?.pending_bookings || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Failures</CardTitle>
            <CreditCard className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {analytics?.failed_bookings || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Card declined/failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {analytics?.expired_bookings || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Payment timeout (5min)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Failed/Expired Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Recent Booking Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          {failedBookings && failedBookings.length > 0 ? (
            <div className="space-y-3">
              {failedBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex flex-col">
                    <div className="font-medium">{booking.guest_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {booking.service} • {booking.party_size} guests
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(booking.booking_date), 'MMM d')} at {booking.booking_time}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={
                        booking.status === 'payment_failed' 
                          ? 'destructive' 
                          : booking.status === 'pending_payment'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {booking.status === 'payment_failed' && 'Payment Failed'}
                      {booking.status === 'expired' && 'Expired'}
                      {booking.status === 'pending_payment' && 'Pending Payment'}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No booking issues in the last 30 days
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payment Analytics Events */}
      {analyticsEvents && analyticsEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Payment Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-2 border rounded text-sm"
                >
                  <div>
                    <span className="font-medium">Booking {event.booking_id}</span>
                    <span className="ml-2 text-muted-foreground">{event.event_type}</span>
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
