import { useState } from "react";
import { format } from "date-fns";
import { OrderLinkReview } from "@/types/square";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

interface LinkToVisitDialogProps {
  review: OrderLinkReview;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LinkToVisitDialog({ review, open, onClose, onSuccess }: LinkToVisitDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [bookingCode, setBookingCode] = useState("");
  const [linking, setLinking] = useState(false);
  const { toast } = useToast();

  const { data: bookings, isLoading: searchLoading } = useQuery({
    queryKey: ['bookings-search', searchQuery, bookingCode],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', format(new Date(), 'yyyy-MM-dd'))
        .in('status', ['confirmed', 'seated', 'finished'])
        .order('booking_time', { ascending: true })
        .limit(10);

      if (bookingCode) {
        query = query.eq('booking_reference', bookingCode.toUpperCase());
      } else if (searchQuery) {
        query = query.or(`guest_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: open && (!!searchQuery || !!bookingCode)
  });

  const handleLink = async (booking: any) => {
    setLinking(true);
    try {
      const { error } = await supabase.rpc('resolve_order_review', {
        p_review_id: review.id,
        p_action: 'link_to_visit',
        p_visit_id: null, // No visits table yet
        p_reservation_id: booking.id,
        p_guest_id: null
      });

      if (error) throw error;

      toast({
        title: "Order linked",
        description: `Order has been linked to booking ${booking.booking_reference}`
      });

      onSuccess();
    } catch (error) {
      console.error('Failed to link order:', error);
      toast({
        title: "Error",
        description: "Failed to link order to visit",
        variant: "destructive"
      });
    } finally {
      setLinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Link Order to Visit</DialogTitle>
          <DialogDescription>
            Search for a booking to link this order to
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Guest Name or Email</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Booking Code</Label>
              <Input
                id="code"
                placeholder="BK-2024-000001"
                value={bookingCode}
                onChange={(e) => setBookingCode(e.target.value)}
              />
            </div>
          </div>

          <div className="border rounded-md">
            {searchLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Searching...
              </div>
            ) : !searchQuery && !bookingCode ? (
              <div className="p-8 text-center text-muted-foreground">
                Enter a search term or booking code to find bookings
              </div>
            ) : !bookings || bookings.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No bookings found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Party Size</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-sm">
                        {booking.booking_reference}
                      </TableCell>
                      <TableCell>{booking.guest_name}</TableCell>
                      <TableCell>{booking.party_size}</TableCell>
                      <TableCell>
                        {booking.booking_time}
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{booking.status}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleLink(booking)}
                          disabled={linking}
                        >
                          Link
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
