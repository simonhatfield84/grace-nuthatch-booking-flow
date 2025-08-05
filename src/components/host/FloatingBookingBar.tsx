
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Booking } from "@/types/booking";

interface FloatingBookingBarProps {
  booking: Booking;
  startHour: number;
  duration: number;
  gridWidth: number;
  onBookingClick: (booking: Booking) => void;
}

export const FloatingBookingBar = ({ 
  booking, 
  startHour, 
  duration, 
  gridWidth,
  onBookingClick 
}: FloatingBookingBarProps) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-500 hover:bg-green-600';
      case 'seated':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'finished':
        return 'bg-gray-400 hover:bg-gray-500';
      case 'cancelled':
        return 'bg-red-500 hover:bg-red-600';
      case 'late':
        return 'bg-orange-500 hover:bg-orange-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Calculate position based on booking time
  const bookingHour = parseInt(booking.booking_time.split(':')[0]);
  const bookingMinute = parseInt(booking.booking_time.split(':')[1]);
  const totalMinutes = (bookingHour - startHour) * 60 + bookingMinute;
  const leftPosition = (totalMinutes / 60) * (gridWidth / 12); // Assuming 12-hour grid
  
  // Calculate width based on duration (default 2 hours if not specified)
  const barWidth = (duration / 60) * (gridWidth / 12);

  return (
    <div
      className={`absolute h-8 rounded-md text-white text-xs flex items-center px-2 cursor-pointer transition-colors shadow-md ${getStatusColor(booking.status)}`}
      style={{
        left: `${leftPosition}px`,
        width: `${Math.max(barWidth, 80)}px`, // Minimum width for readability
        zIndex: 10
      }}
      onClick={() => onBookingClick(booking)}
    >
      <div className="flex items-center justify-between w-full overflow-hidden">
        <span className="font-medium truncate">
          {booking.guest_name}
        </span>
        <Badge variant="secondary" className="ml-2 bg-white/20 text-white text-xs">
          {booking.party_size}
        </Badge>
      </div>
    </div>
  );
};
