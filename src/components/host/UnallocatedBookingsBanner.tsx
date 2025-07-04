
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Users, Clock, RefreshCw } from "lucide-react";
import { Booking } from "@/hooks/useBookings";

interface UnallocatedBookingsBannerProps {
  bookings: Booking[];
  onAllocateAll: () => void;
  onBookingClick: (booking: Booking) => void;
}

export const UnallocatedBookingsBanner = ({ 
  bookings, 
  onAllocateAll, 
  onBookingClick 
}: UnallocatedBookingsBannerProps) => {
  if (bookings.length === 0) return null;

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50 dark:bg-orange-950">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span className="font-semibold text-orange-800 dark:text-orange-200">
              Unallocated Bookings ({bookings.length})
            </span>
          </div>
          <Button 
            onClick={onAllocateAll}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Auto-Allocate All
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              onClick={() => onBookingClick(booking)}
              className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border cursor-pointer hover:shadow-md transition-shadow min-h-[44px]"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{booking.guest_name}</div>
                <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {booking.booking_time}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {booking.party_size}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
