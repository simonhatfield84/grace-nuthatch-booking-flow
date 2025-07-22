
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface BookingStatsProps {
  selectedDate: Date;
}

export const BookingStats = ({ selectedDate }: BookingStatsProps) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["booking-stats", selectedDate],
    queryFn: async () => {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("bookings")
        .select("status, party_size")
        .eq("booking_date", dateStr);

      if (error) throw error;

      const stats = {
        total: data.length,
        confirmed: data.filter(b => b.status === 'confirmed').length,
        pending: data.filter(b => b.status === 'pending_payment').length,
        cancelled: data.filter(b => b.status === 'cancelled').length,
        failed: data.filter(b => b.status === 'payment_failed').length,
        expired: data.filter(b => b.status === 'expired').length,
        finished: data.filter(b => b.status === 'finished').length,
        no_show: data.filter(b => b.status === 'no_show').length,
        totalGuests: data.reduce((sum, b) => sum + b.party_size, 0)
      };

      return stats;
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Total Bookings",
      value: stats.total,
      icon: Calendar,
      description: `${stats.totalGuests} total guests`
    },
    {
      title: "Confirmed",
      value: stats.confirmed,
      icon: CheckCircle,
      description: "Active reservations"
    },
    {
      title: "Pending Payment",
      value: stats.pending,
      icon: Clock,
      description: "Awaiting payment"
    },
    {
      title: "Issues",
      value: stats.failed + stats.expired + stats.cancelled + stats.no_show,
      icon: AlertCircle,
      description: `${stats.failed} failed, ${stats.expired} expired, ${stats.cancelled} cancelled, ${stats.no_show} no-show`
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
