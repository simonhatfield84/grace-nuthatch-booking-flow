
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

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

interface BookingCardProps {
  booking: Booking;
  onUpdate: () => void;
}

export const BookingCard = ({ booking, onUpdate }: BookingCardProps) => {
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

  return (
    <Card>
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
            <span className="font-medium">Time:</span> {booking.booking_time}
            {booking.end_time && ` - ${booking.end_time}`}
          </div>
          {booking.tables && (
            <div>
              <span className="font-medium">Table:</span> {booking.tables.label}
            </div>
          )}
          {booking.email && (
            <div className="col-span-2">
              <span className="font-medium">Email:</span> {booking.email}
            </div>
          )}
          {booking.phone && (
            <div className="col-span-2">
              <span className="font-medium">Phone:</span> {booking.phone}
            </div>
          )}
          {booking.notes && (
            <div className="col-span-2">
              <span className="font-medium">Notes:</span> {booking.notes}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
