
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { TrendingUp, TrendingDown, Clock, CreditCard, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

interface PaymentAnalyticsData {
  total_bookings: number;
  confirmed_bookings: number;
  failed_bookings: number;
  expired_bookings: number;
  pending_bookings: number;
  recovered_bookings: number;
  conversion_rate: number;
  total_revenue_cents: number;
}

export const EnhancedPaymentAnalytics = () => {
  // Fetch enhanced payment analytics
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["enhanced-payment-analytics"],
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
      
      // For now, we'll use booking_audit to approximate recovery events
      // This will be properly tracked once payment_analytics is available
      const recoveredBookings = 0; // Placeholder
      const conversionRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;

      return {
        total_bookings: totalBookings,
        confirmed_bookings: confirmedBookings,
        failed_bookings: failedBookings,
        expired_bookings: expiredBookings,
        pending_bookings: pendingBookings,
        recovered_bookings: recoveredBookings,
        conversion_rate: conversionRate,
        total_revenue_cents: 0 // Would need to calculate from payment records
      } as PaymentAnalyticsData;
    },
  });

  // Fetch recent stuck bookings
  const { data: stuckBookings } = useQuery({
    queryKey: ["stuck-bookings"],
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
      {/* Enhanced Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            {(analytics?.conversion_rate || 0) >= 80 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
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
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics?.confirmed_bookings || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analytics?.failed_bookings || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Declined/failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {analytics?.pending_bookings || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovered</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analytics?.recovered_bookings || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Manual recovery
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Problem Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Recent Problem Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stuckBookings && stuckBookings.length > 0 ? (
            <div className="space-y-3">
              {stuckBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex flex-col">
                    <div className="font-medium">#{booking.id} - {booking.guest_name}</div>
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
                        booking.status === 'payment_failed' ? 'destructive' : 
                        booking.status === 'expired' ? 'secondary' : 'default'
                      }
                    >
                      {booking.status === 'payment_failed' ? 'Payment Failed' : 
                       booking.status === 'expired' ? 'Expired' : 'Pending Payment'}
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
              No recent problem bookings
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
