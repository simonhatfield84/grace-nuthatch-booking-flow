
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Users, Clock, Phone, Mail, MapPin, FileText, Calendar, Hash, Edit } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Booking } from "@/hooks/useBookings";
import { BookingAuditTrail } from "./BookingAuditTrail";
import { BookingEditForm } from "./BookingEditForm";
import { useTables } from "@/hooks/useTables";

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
  const [isEditing, setIsEditing] = useState(false);
  const { tables } = useTables();

  if (!booking) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200';
      case 'seated':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200';
      case 'finished':
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200';
      case 'late':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const statusOptions = ['confirmed', 'seated', 'finished', 'cancelled', 'late'];

  const getAvailableTables = () => {
    return tables.filter(table => table.seats >= booking.party_size);
  };

  const handleTableAssignment = (tableId: string) => {
    // This would trigger a manual table assignment
    console.log('Assign booking to table:', tableId);
  };

  const handleEditSave = (updatedBooking: Booking) => {
    setIsEditing(false);
    onBookingUpdate();
  };

  if (isEditing) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Edit Booking</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1">
          <BookingEditForm
            booking={booking}
            onSave={handleEditSave}
            onCancel={() => setIsEditing(false)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Booking Details
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-6">
        <ScrollArea className="flex-1">
          <div className="space-y-6">
            {/* Guest Information */}
            <div>
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Users className="h-4 w-4" />
                Guest Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Name:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{booking.guest_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Party Size:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{booking.party_size} guests</span>
                </div>
                {booking.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Phone:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{booking.phone}</span>
                  </div>
                )}
                {booking.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email:
                    </span>
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{booking.email}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Booking Information */}
            <div>
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Calendar className="h-4 w-4" />
                Booking Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    Booking ID:
                  </span>
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {booking.booking_reference || `#${booking.id}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Date:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {format(new Date(booking.booking_date), 'EEEE, MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Time:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {booking.booking_time}
                    {booking.end_time && booking.status === 'finished' && 
                      ` - ${booking.end_time}`
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Duration:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {Math.floor((booking.duration_minutes || 120) / 60)}h {((booking.duration_minutes || 120) % 60)}m
                  </span>
                </div>
                {booking.service && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Service:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{booking.service}</span>
                  </div>
                )}
                {booking.table_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Table:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {tables.find(t => t.id === booking.table_id)?.label || `Table ${booking.table_id}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Manual Table Assignment */}
            {!booking.table_id && (
              <div>
                <h3 className="font-medium text-sm mb-3 text-gray-900 dark:text-gray-100">Manual Table Assignment</h3>
                <Select onValueChange={handleTableAssignment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTables().map((table) => (
                      <SelectItem key={table.id} value={table.id.toString()}>
                        {table.label} ({table.seats} seats)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status */}
            <div>
              <h3 className="font-medium text-sm mb-3 text-gray-900 dark:text-gray-100">Status</h3>
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
                  <h3 className="font-medium text-sm mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <FileText className="h-4 w-4" />
                    Notes
                  </h3>
                  <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded text-gray-900 dark:text-gray-100">
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
