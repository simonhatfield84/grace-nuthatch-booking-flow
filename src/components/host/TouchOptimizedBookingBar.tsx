
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, Users, Phone, Mail } from "lucide-react";

interface Booking {
  id: number;
  guest_name: string;
  party_size: number;
  booking_time: string;
  status: string;
  phone?: string;
  email?: string;
  notes?: string;
  service?: string;
}

interface TouchOptimizedBookingBarProps {
  booking: Booking;
  startTime: string;
  onBookingClick: (booking: Booking) => void;
}

export const TouchOptimizedBookingBar = ({ 
  booking, 
  startTime,
  onBookingClick 
}: TouchOptimizedBookingBarProps) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-500 hover:bg-green-600 border-green-600';
      case 'seated':
        return 'bg-blue-500 hover:bg-blue-600 border-blue-600';
      case 'finished':
        return 'bg-gray-400 hover:bg-gray-500 border-gray-500';
      case 'cancelled':
        return 'bg-red-500 hover:bg-red-600 border-red-600';
      case 'late':
        return 'bg-orange-500 hover:bg-orange-600 border-orange-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600 border-gray-600';
    }
  };

  // Calculate position based on booking time (15-minute segments)
  const calculatePosition = () => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [bookingHour, bookingMin] = booking.booking_time.split(':').map(Number);
    
    const startTotalMin = startHour * 60 + startMin;
    const bookingTotalMin = bookingHour * 60 + bookingMin;
    const diffMin = Math.max(0, bookingTotalMin - startTotalMin);
    
    return (diffMin / 15) * 60; // 60px per 15-minute slot
  };

  const leftPosition = calculatePosition();
  const width = 120; // 2-hour duration = 8 slots * 15px each

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`absolute rounded-md text-white text-xs flex items-center px-3 cursor-pointer transition-all duration-200 shadow-lg border-l-4 min-h-[44px] ${getStatusColor(booking.status)}`}
            style={{
              left: `${leftPosition}px`,
              width: `${width}px`,
              top: '4px',
              zIndex: 10
            }}
            onClick={() => onBookingClick(booking)}
          >
            <div className="flex items-center justify-between w-full min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold truncate text-sm">
                  {booking.guest_name}
                </span>
                <Badge variant="secondary" className="bg-white/20 text-white text-xs px-1 py-0">
                  <Users className="h-3 w-3 mr-1" />
                  {booking.party_size}
                </Badge>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Clock className="h-3 w-3" />
                <span className="text-xs">{booking.booking_time}</span>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-semibold">{booking.guest_name}</div>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3" />
                <span>{booking.party_size} guests</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>{booking.booking_time}</span>
              </div>
              {booking.service && (
                <div><strong>Service:</strong> {booking.service}</div>
              )}
              {booking.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span>{booking.phone}</span>
                </div>
              )}
              {booking.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <span>{booking.email}</span>
                </div>
              )}
              {booking.notes && (
                <div><strong>Notes:</strong> {booking.notes}</div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
