
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar, Users, Clock, CreditCard, AlertTriangle } from "lucide-react";

interface BookingStatsProps {
  selectedDate: Date;
}

export const BookingStats = ({ selectedDate }: BookingStatsProps) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["booking-stats", selectedDate],
    queryFn: async () => {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("status, party_size")
        .eq("booking_date", dateStr);

      if (error) throw error;

      const totalBookings = bookings.length;
      const confirmedBookings = bookings.filter(b => b.status === "confirmed").length;
      const pendingPayment = bookings.filter(b => b.status === "pending_payment").length;
      const cancelled = bookings.filter(b => b.status === "cancelled").length;
      const paymentFailed = bookings.filter(b => b.status === "payment_failed").length;
      const expired = bookings.filter(b => b.status === "expired").length;
      const totalGuests = bookings
        .filter(b => ["confirmed", "pending_payment"].includes(b.status))
        .reduce((sum, b) => sum + (b.party_size || 0), 0);

      return {
        totalBookings,
        confirmedBookings,
        pendingPayment,
        cancelled,
        paymentFailed,
        expired,
        totalGuests,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
          <Users className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{stats?.confirmedBookings || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
          <Clock className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">{stats?.pendingPayment || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Payment Issues</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {(stats?.paymentFailed || 0) + (stats?.expired || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats?.paymentFailed || 0} failed, {stats?.expired || 0} expired
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalGuests || 0}</div>
        </CardContent>
      </Card>
    </div>
  );
};
