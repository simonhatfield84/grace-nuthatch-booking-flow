
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, Users, Phone, Mail } from "lucide-react";
import { Booking } from "@/types/booking";

interface ImprovedFloatingBookingBarProps {
  booking: Booking;
  startHour: number;
  duration: number;
  onBookingClick: (booking: Booking) => void;
}

export const ImprovedFloatingBookingBar = ({ 
  booking, 
  startHour, 
  duration,
  onBookingClick 
}: ImprovedFloatingBookingBarProps) => {
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

  // Calculate position based on booking time
  const [hours, minutes] = booking.booking_time.split(':').map(Number);
  const totalMinutes = (hours - startHour) * 60 + minutes;
  const leftPercentage = Math.max(0, (totalMinutes / 60) * (100 / 12)); // 12-hour grid
  
  // Calculate width based on duration (minimum 2 hours)
  const widthPercentage = Math.max(10, (duration / 60) * (100 / 12));

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`absolute h-10 rounded-md text-white text-xs flex items-center px-3 cursor-pointer transition-all duration-200 shadow-lg border-l-4 ${getStatusColor(booking.status)}`}
            style={{
              left: `${leftPercentage}%`,
              width: `${Math.min(widthPercentage, 100 - leftPercentage)}%`,
              zIndex: 10,
              top: '2px'
            }}
            onClick={() => onBookingClick(booking)}
          >
            <div className="flex items-center justify-between w-full min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold truncate">
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
