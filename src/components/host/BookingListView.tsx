
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Clock, Users, MapPin, DollarSign } from "lucide-react";

interface BookingListViewProps {
  bookings: any[];
  tables: any[];
  onBookingClick: (booking: any) => void;
}

export const BookingListView = ({ bookings, tables, onBookingClick }: BookingListViewProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-[#C2D8E9] text-[#111315] border-[#C2D8E9]/30';
      case 'seated': return 'bg-[#CCF0DB] text-[#111315] border-[#CCF0DB]/30';
      case 'finished': return 'bg-[#676767] text-white border-[#676767]/30';
      case 'cancelled': return 'bg-[#E47272] text-white border-[#E47272]/30';
      case 'late': return 'bg-[#F1C8D0] text-[#111315] border-[#F1C8D0]/30';
      case 'no-show': return 'bg-[#E47272] text-white border-[#E47272]/30';
      default: return 'bg-[#C2D8E9] text-[#111315] border-[#C2D8E9]/30';
    }
  };

  const getBookingCardStyle = (status: string) => {
    const isInactive = status === 'no-show' || status === 'cancelled';
    return isInactive 
      ? 'bg-[#292C2D] border-[#E47272] opacity-75' 
      : 'bg-[#292C2D] border-[#676767]/20 hover:bg-[#676767]/20';
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
    <div className="h-full bg-[#111315] rounded-2xl overflow-hidden border border-[#292C2D] shadow-2xl">
      <div className="bg-[#292C2D] border-b border-[#676767]/20 p-6 shadow-lg rounded-t-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white font-inter">Bookings List</h2>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#CCF0DB]" />
            <span className="text-white font-inter">{bookings.length} total</span>
          </div>
        </div>
      </div>
      
      <ScrollArea className="h-[calc(100%-88px)] scrollbar-hide">
        <div className="p-6 space-y-4">
          {sortedBookings.map((booking) => {
            const table = tables.find(t => t.id === booking.table_id);
            
            return (
              <div
                key={booking.id}
                className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl ${getBookingCardStyle(booking.status)}`}
                onClick={() => onBookingClick(booking)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-white text-lg font-inter">
                        {booking.guest_name}
                      </h3>
                      <Badge className={`${getStatusColor(booking.status)} font-inter font-medium px-3 py-1 text-sm`}>
                        {booking.status}
                      </Badge>
                      {booking.deposit_per_guest > 0 && (
                        <DollarSign className="h-4 w-4 text-[#CCF0DB] opacity-80" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-[#676767]">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#C2D8E9]" />
                        <span className="font-inter font-medium">{booking.booking_time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#CCF0DB]" />
                        <span className="font-inter font-medium">{booking.party_size} guests</span>
                      </div>
                      {table && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[#F1C8D0]" />
                          <span className="font-inter font-medium">{table.label}</span>
                        </div>
                      )}
                      {booking.service && (
                        <div className="text-[#676767] font-inter">
                          {booking.service}
                        </div>
                      )}
                    </div>

                    {booking.notes && (
                      <div className="mt-2 text-sm text-[#676767] font-inter italic">
                        {booking.notes}
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[#CCF0DB] hover:text-white hover:bg-[#676767]/30 font-inter ml-4"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            );
          })}
          
          {bookings.length === 0 && (
            <div className="text-center text-[#676767] py-12">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-inter">No bookings for this date</p>
              <p className="text-sm font-inter mt-2">Bookings will appear here when created</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
