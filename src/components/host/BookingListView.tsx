
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Users, MapPin, Phone, Mail } from "lucide-react";

interface Booking {
  id: number;
  guest_name: string;
  party_size: number;
  booking_time: string;
  status: 'confirmed' | 'seated' | 'finished' | 'cancelled' | 'late';
  service: string;
  table_id: number | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
}

interface Table {
  id: number;
  label: string;
  seats: number;
}

interface BookingListViewProps {
  bookings: Booking[];
  tables: Table[];
  onBookingClick: (booking: Booking) => void;
}

export const BookingListView = ({ bookings, tables, onBookingClick }: BookingListViewProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'seated': return 'secondary';
      case 'finished': return 'outline';
      case 'cancelled': return 'destructive';
      case 'late': return 'destructive';
      default: return 'outline';
    }
  };

  const getTableLabel = (tableId: number | null) => {
    if (!tableId) return 'Unallocated';
    const table = tables.find(t => t.id === tableId);
    return table ? table.label : 'Unknown';
  };

  const sortedBookings = [...bookings].sort((a, b) => {
    if (a.booking_time !== b.booking_time) {
      return a.booking_time.localeCompare(b.booking_time);
    }
    return a.guest_name.localeCompare(b.guest_name);
  });

  return (
    <div className="h-full bg-gray-800 rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-600">
        <h3 className="text-lg font-semibold text-white">Chronological Booking List</h3>
        <p className="text-sm text-gray-400">{bookings.length} bookings today</p>
      </div>
      
      <ScrollArea className="h-[calc(100%-80px)]">
        <div className="p-4 space-y-3">
          {sortedBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No bookings for today</p>
            </div>
          ) : (
            sortedBookings.map((booking) => (
              <Card 
                key={booking.id} 
                className={`cursor-pointer transition-colors hover:bg-gray-700 ${
                  booking.status === 'cancelled' ? 'border-red-500 bg-red-950/20' : 'bg-gray-750 border-gray-600'
                }`}
                onClick={() => onBookingClick(booking)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-blue-400">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">{booking.booking_time}</span>
                      </div>
                      <Badge variant={getStatusColor(booking.status) as any} className="text-xs">
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{getTableLabel(booking.table_id)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white text-lg">{booking.guest_name}</h4>
                    <div className="flex items-center gap-1 text-gray-300">
                      <Users className="h-4 w-4" />
                      <span>{booking.party_size} guests</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="bg-gray-700 px-2 py-1 rounded text-xs">{booking.service}</span>
                    
                    {booking.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{booking.phone}</span>
                      </div>
                    )}
                    
                    {booking.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span>{booking.email}</span>
                      </div>
                    )}
                  </div>
                  
                  {booking.notes && (
                    <p className="text-sm text-gray-400 mt-2 italic">"{booking.notes}"</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
