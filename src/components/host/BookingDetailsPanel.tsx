
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Users, Clock, Phone, Mail, Edit, Trash2 } from "lucide-react";
import { Booking } from "@/hooks/useBookings";

interface BookingDetailsPanelProps {
  booking: Booking | null;
  onClose: () => void;
  onEdit?: (booking: Booking) => void;
  onDelete?: (booking: Booking) => void;
  onStatusChange?: (booking: Booking, status: string) => void;
}

export const BookingDetailsPanel = ({ 
  booking, 
  onClose, 
  onEdit, 
  onDelete, 
  onStatusChange 
}: BookingDetailsPanelProps) => {
  if (!booking) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'seated': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'finished': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'late': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const statusOptions = ['confirmed', 'seated', 'finished', 'cancelled', 'late'];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Booking Details</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="min-h-[44px] min-w-[44px]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-6">
        {/* Guest Information */}
        <div>
          <h3 className="font-semibold text-lg mb-3">{booking.guest_name}</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span>{booking.party_size} guests</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{booking.booking_time} on {booking.booking_date}</span>
            </div>
            {booking.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{booking.phone}</span>
              </div>
            )}
            {booking.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{booking.email}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Status */}
        <div>
          <h4 className="font-medium mb-2">Status</h4>
          <Badge className={`${getStatusColor(booking.status)} capitalize mb-3`}>
            {booking.status}
          </Badge>
          
          {onStatusChange && (
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <Button
                  key={status}
                  variant={booking.status === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => onStatusChange(booking, status)}
                  className="capitalize min-h-[44px]"
                >
                  {status}
                </Button>
              ))}
            </div>
          )}
        </div>

        {booking.service && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Service</h4>
              <p>{booking.service}</p>
            </div>
          </>
        )}

        {booking.notes && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Notes</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{booking.notes}</p>
            </div>
          </>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          {onEdit && (
            <Button 
              variant="outline" 
              onClick={() => onEdit(booking)}
              className="flex-1 min-h-[44px]"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="destructive" 
              onClick={() => onDelete(booking)}
              className="flex-1 min-h-[44px]"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
