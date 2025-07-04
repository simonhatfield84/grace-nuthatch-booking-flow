
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X, Users, Clock, Phone, Mail, MapPin, FileText, Calendar, Hash } from "lucide-react";
import { format } from "date-fns";
import { Booking } from "@/hooks/useBookings";
import { BookingAuditTrail } from "./BookingAuditTrail";

interface BookingDetailsPanelProps {
  booking: Booking | null;
  onClose: () => void;
  onStatusChange: (booking: Booking, newStatus: string) => void;
  onBookingUpdate: () => void;
}

export const BookingDetailsPanel = ({ 
  booking, 
  onClose, 
  onStatusChange, 
  onBookingUpdate 
}: BookingDetailsPanelProps) => {
  if (!booking) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'seated':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'finished':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'late':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const statusOptions = ['confirmed', 'seated', 'finished', 'cancelled', 'late'];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Booking Details</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-6">
        <ScrollArea className="flex-1">
          <div className="space-y-6">
            {/* Guest Information */}
            <div>
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Guest Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="font-medium">{booking.guest_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Party Size:</span>
                  <span className="font-medium">{booking.party_size} guests</span>
                </div>
                {booking.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Phone:
                    </span>
                    <span className="font-medium">{booking.phone}</span>
                  </div>
                )}
                {booking.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email:
                    </span>
                    <span className="font-medium text-sm">{booking.email}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Booking Information */}
            <div>
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Booking Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    Booking ID:
                  </span>
                  <span className="font-medium text-sm">
                    {booking.booking_reference || `#${booking.id}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Date:</span>
                  <span className="font-medium">
                    {format(new Date(booking.booking_date), 'EEEE, MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Time:
                  </span>
                  <span className="font-medium">
                    {booking.booking_time}
                    {booking.end_time && booking.status === 'finished' && 
                      ` - ${booking.end_time}`
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Duration:</span>
                  <span className="font-medium">
                    {Math.floor((booking.duration_minutes || 120) / 60)}h {((booking.duration_minutes || 120) % 60)}m
                  </span>
                </div>
                {booking.service && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Service:</span>
                    <span className="font-medium">{booking.service}</span>
                  </div>
                )}
                {booking.table_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Table:
                    </span>
                    <span className="font-medium">Table {booking.table_id}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Status */}
            <div>
              <h3 className="font-medium text-sm mb-3">Status</h3>
              <div className="space-y-3">
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </Badge>
                
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={booking.status === status ? "default" : "outline"}
                      onClick={() => onStatusChange(booking, status)}
                      className="text-xs"
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {booking.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes
                  </h3>
                  <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    {booking.notes}
                  </p>
                </div>
              </>
            )}

            <Separator />

            {/* Audit Trail */}
            <BookingAuditTrail bookingId={booking.id} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
