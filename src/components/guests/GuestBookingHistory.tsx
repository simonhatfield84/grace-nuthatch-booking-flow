import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Receipt, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface GuestBookingHistoryProps {
  guestId: string;
  guestEmail?: string;
  guestPhone?: string;
}

interface BookingWithOrder {
  id: number;
  booking_date: string;
  booking_time: string;
  service: string;
  party_size: number;
  status: string;
  source: string;
  variant?: string;
  order_id?: string;
  order_total?: number;
  notes?: string;
}

export const GuestBookingHistory = ({ guestId, guestEmail, guestPhone }: GuestBookingHistoryProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showAll, setShowAll] = React.useState(false);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['guest-bookings', guestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          booking_time,
          service,
          party_size,
          status,
          source,
          variant,
          notes
        `)
        .or(`email.ilike.${guestEmail || ''}, phone.eq.${guestPhone || ''}`)
        .order('booking_date', { ascending: false })
        .order('booking_time', { ascending: false });

      if (error) throw error;

      // Fetch order links for these bookings
      const bookingIds = data?.map(b => b.id) || [];
      const { data: orderLinks } = await supabase
        .from('order_links')
        .select('visit_id, order_id')
        .in('visit_id', bookingIds);

      // Fetch order totals
      const orderIds = orderLinks?.map(ol => ol.order_id) || [];
      const { data: orders } = await supabase
        .from('square_orders')
        .select('order_id, total_money')
        .in('order_id', orderIds);

      // Merge data
      const bookingsWithOrders: BookingWithOrder[] = (data || []).map(booking => {
        const orderLink = orderLinks?.find(ol => ol.visit_id === booking.id);
        const order = orders?.find(o => o.order_id === orderLink?.order_id);
        
        return {
          ...booking,
          order_id: orderLink?.order_id,
          order_total: order?.total_money
        };
      });

      return bookingsWithOrders;
    },
    enabled: !!(guestEmail || guestPhone)
  });

  const displayedBookings = showAll ? bookings : bookings?.slice(0, 5);
  const hasMore = (bookings?.length || 0) > 5;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'seated': return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'finished': return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-700 border-red-500/30';
      case 'no_show': return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    }
  };

  const getSourceLabel = (source: string, variant?: string) => {
    if (variant) return `${source} (${variant})`;
    return source;
  };

  if (!guestEmail && !guestPhone) {
    return (
      <div className="text-sm text-muted-foreground">
        No contact information available to fetch booking history
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
          <div className="text-base font-medium">
            Booking History {bookings && `(${bookings.length} visits)`}
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading booking history...</div>
        ) : !bookings || bookings.length === 0 ? (
          <div className="text-sm text-muted-foreground">No bookings found</div>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Spend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedBookings?.map((booking) => (
                    <TableRow key={booking.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div className="font-medium">
                          {format(new Date(booking.booking_date), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {booking.booking_time}
                        </div>
                      </TableCell>
                      <TableCell>{booking.service || 'Walk-In'}</TableCell>
                      <TableCell>{booking.party_size}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {getSourceLabel(booking.source, booking.variant)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {booking.order_total ? (
                          <div className="flex items-center justify-end gap-2">
                            <Receipt className="h-4 w-4 text-primary" />
                            <span className="font-medium">
                              £{(booking.order_total / 100).toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {hasMore && !showAll && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => setShowAll(true)}
              >
                Show All {bookings.length} Bookings
              </Button>
            )}
            
            {showAll && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => setShowAll(false)}
              >
                Show Less
              </Button>
            )}
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
