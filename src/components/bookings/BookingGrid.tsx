
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookingCard } from "./BookingCard";
import { BookingFilters } from "./BookingFilters";
import { BookingStats } from "./BookingStats";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Booking {
  id: number;
  guest_name: string;
  email?: string;
  phone?: string;
  party_size: number;
  booking_date: string;
  booking_time: string;
  end_time?: string;
  service: string;
  status: 'confirmed' | 'cancelled' | 'finished' | 'no_show' | 'pending_payment' | 'payment_failed' | 'expired';
  notes?: string;
  table_id?: number;
  is_unallocated?: boolean;
  created_at: string;
  updated_at: string;
  cancellation_reason?: string;
  payment_timeout_at?: string;
  tables?: { label: string; seats: number };
}

export const BookingGrid = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [showFailedBookings, setShowFailedBookings] = useState(false);

  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ["bookings", selectedDate, statusFilter, showFailedBookings],
    queryFn: async () => {
      let query = supabase
        .from("bookings")
        .select(`
          *,
          tables (label, seats)
        `)
        .order("booking_time", { ascending: true });

      if (showFailedBookings) {
        // Show payment failures and expired bookings
        query = query.in("status", ["payment_failed", "expired"]);
      } else {
        // Apply date and status filters for regular bookings
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        query = query.eq("booking_date", dateStr);

        switch (statusFilter) {
          case "confirmed":
            query = query.eq("status", "confirmed");
            break;
          case "pending":
            query = query.eq("status", "pending_payment");
            break;
          case "cancelled":
            query = query.eq("status", "cancelled");
            break;
          case "finished":
            query = query.eq("status", "finished");
            break;
          case "no_show":
            query = query.eq("status", "no_show");
            break;
          case "active":
          default:
            query = query.in("status", ["confirmed", "pending_payment"]);
            break;
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Booking[];
    },
  });

  // Auto-refresh every 30 seconds to catch status updates
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  const getStatusBadge = (booking: Booking) => {
    switch (booking.status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-success text-success-foreground">Confirmed</Badge>;
      case 'pending_payment':
        return <Badge variant="secondary">Pending Payment</Badge>;
      case 'payment_failed':
        return <Badge variant="destructive">Payment Failed</Badge>;
      case 'expired':
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">Expired</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      case 'finished':
        return <Badge variant="outline" className="bg-success/10">Finished</Badge>;
      case 'no_show':
        return <Badge variant="destructive" className="bg-destructive/10">No Show</Badge>;
      default:
        return <Badge variant="outline">{booking.status}</Badge>;
    }
  };

  const getFailureReason = (booking: Booking) => {
    if (booking.cancellation_reason) {
      switch (booking.cancellation_reason) {
        case 'payment_timeout':
          return 'Payment window expired (5 minutes)';
        case 'payment_declined':
          return 'Payment was declined';
        case 'payment_canceled':
          return 'Customer cancelled payment';
        default:
          return booking.cancellation_reason;
      }
    }
    return 'Unknown reason';
  };

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!showFailedBookings && (
        <>
          <BookingStats selectedDate={selectedDate} />
          <BookingFilters
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </>
      )}

      {/* Toggle for Failed Bookings View */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {showFailedBookings ? "Failed Bookings" : `Bookings for ${format(selectedDate, "MMMM d, yyyy")}`}
        </h2>
        <button
          onClick={() => setShowFailedBookings(!showFailedBookings)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showFailedBookings ? "View Regular Bookings" : "View Failed Bookings"}
        </button>
      </div>

      {showFailedBookings ? (
        // Failed Bookings View
        <div className="space-y-4">
          {bookings && bookings.length > 0 ? (
            bookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{booking.guest_name}</CardTitle>
                    {getStatusBadge(booking)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Service:</span> {booking.service}
                    </div>
                    <div>
                      <span className="font-medium">Party Size:</span> {booking.party_size}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {format(new Date(booking.booking_date), "MMM d, yyyy")}
                    </div>
                    <div>
                      <span className="font-medium">Time:</span> {booking.booking_time}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Reason:</span> {getFailureReason(booking)}
                    </div>
                    {booking.email && (
                      <div className="col-span-2">
                        <span className="font-medium">Email:</span> {booking.email}
                      </div>
                    )}
                    {booking.payment_timeout_at && (
                      <div className="col-span-2 text-xs text-muted-foreground">
                        Expired: {format(new Date(booking.payment_timeout_at), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No failed bookings found</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        // Regular Bookings View
        <div className="grid gap-4">
          {bookings && bookings.length > 0 ? (
            bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onUpdate={() => refetch()}
              />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  No bookings found for {format(selectedDate, "MMMM d, yyyy")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
