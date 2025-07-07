
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Clock, Users, MapPin } from "lucide-react";

interface BookingListViewProps {
  bookings: any[];
  tables: any[];
  onBookingClick: (booking: any) => void;
}

export const BookingListView = ({ bookings, tables, onBookingClick }: BookingListViewProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'seated': return 'bg-green-100 text-green-800';
      case 'finished': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-orange-100 text-orange-800';
      case 'no-show': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'cancelled':
      case 'no-show':
        return 'text-red-600';
      default:
        return 'text-white';
    }
  };

  // Sort bookings by time, then by status (no-show and cancelled at bottom)
  const sortedBookings = [...bookings].sort((a, b) => {
    // First sort by status priority (active bookings first)
    const aIsInactive = a.status === 'no-show' || a.status === 'cancelled';
    const bIsInactive = b.status === 'no-show' || b.status === 'cancelled';
    
    if (aIsInactive !== bIsInactive) {
      return aIsInactive ? 1 : -1;
    }
    
    // Then sort by time
    return a.booking_time.localeCompare(b.booking_time);
  });

  return (
    <div className="h-full bg-gray-700">
      <div className="p-4 border-b border-gray-600">
        <h2 className="text-lg font-semibold text-white">Bookings List</h2>
      </div>
      
      <ScrollArea className="h-[calc(100%-80px)]">
        <div className="p-4 space-y-3">
          {sortedBookings.map((booking) => {
            const table = tables.find(t => t.id === booking.table_id);
            const isInactive = booking.status === 'no-show' || booking.status === 'cancelled';
            
            return (
              <div
                key={booking.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  isInactive 
                    ? 'bg-gray-800 border-red-400 opacity-75' 
                    : 'bg-gray-600 border-gray-500 hover:bg-gray-500'
                }`}
                onClick={() => onBookingClick(booking)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`font-semibold ${getStatusTextColor(booking.status)}`}>
                        {booking.guest_name}
                      </h3>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-300">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {booking.booking_time}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {booking.party_size} guests
                      </div>
                      {table && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {table.label}
                        </div>
                      )}
                      {booking.service && (
                        <div className="text-gray-400">
                          {booking.service}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                    View Details
                  </Button>
                </div>
              </div>
            );
          })}
          
          {bookings.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              No bookings for this date
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
