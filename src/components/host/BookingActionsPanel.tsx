import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, MapPin, Plus, Check, X } from 'lucide-react';
import { Booking } from '@/features/booking/types/booking';

interface BookingActionsPanelProps {
  booking: Booking | null;
  onClose: () => void;
  onExtendBooking: (bookingId: number, minutes: number) => void;
  onExtendUntilNext: (bookingId: number) => void;
  onStatusChange: (booking: Booking, newStatus: string) => void;
  nextBookingTime?: string;
}

export const BookingActionsPanel = ({
  booking,
  onClose,
  onExtendBooking,
  onExtendUntilNext,
  onStatusChange,
  nextBookingTime
}: BookingActionsPanelProps) => {
  if (!booking) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'seated': return 'bg-blue-100 text-blue-800';
      case 'finished': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canExtend = booking.status !== 'finished' && booking.status !== 'cancelled';
  const canMarkSeated = booking.status === 'confirmed';
  const canMarkFinished = booking.status === 'seated' || booking.status === 'confirmed';

  return (
    <Card className="w-80 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Booking Details</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Guest Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{booking.guest_name}</h3>
            <Badge className={getStatusColor(booking.status)}>
              {booking.status.toUpperCase()}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {booking.party_size} guests
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {booking.booking_time}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Table {booking.table_id}
            </div>
            <div className="text-xs">
              {booking.duration_minutes} mins
            </div>
          </div>

          {booking.service && (
            <Badge variant="outline">{booking.service}</Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Quick Actions</h4>
          
          <div className="grid grid-cols-2 gap-2">
            {canMarkSeated && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange(booking, 'seated')}
                className="flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                Seat
              </Button>
            )}
            
            {canMarkFinished && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange(booking, 'finished')}
                className="flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                Finish
              </Button>
            )}
          </div>
        </div>

        {/* Extend Options */}
        {canExtend && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Extend Booking</h4>
            
            <div className="space-y-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onExtendBooking(booking.id, 30)}
                className="w-full flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Add 30 minutes
              </Button>
              
              {nextBookingTime && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onExtendUntilNext(booking.id)}
                  className="w-full flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Until next ({nextBookingTime})
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Booking Info */}
        <div className="pt-2 border-t space-y-1 text-xs text-gray-500">
          <div>Ref: {booking.booking_reference || 'N/A'}</div>
          <div>Created: {new Date(booking.created_at).toLocaleDateString()}</div>
          {booking.notes && (
            <div className="text-xs">
              <span className="font-medium">Notes:</span> {booking.notes}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
