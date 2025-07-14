
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, Users, Phone, Mail, DollarSign } from "lucide-react";
import { useState } from "react";

interface Booking {
  id: number;
  guest_name: string;
  party_size: number;
  booking_time: string;
  status: 'confirmed' | 'seated' | 'finished' | 'cancelled' | 'late' | 'no_show' | 'pending_payment';
  duration_minutes?: number;
  phone?: string;
  email?: string;
  notes?: string;
  service?: string;
  end_time?: string;
  booking_reference?: string;
  requires_payment?: boolean;
}

interface TouchOptimizedBookingBarProps {
  booking: Booking;
  startTime: string;
  onBookingClick: (booking: Booking) => void;
  onBookingDrag?: (bookingId: number, newTime: string, newTableId?: number) => void;
}

export const TouchOptimizedBookingBar = ({ 
  booking, 
  startTime,
  onBookingClick,
  onBookingDrag
}: TouchOptimizedBookingBarProps) => {
  const [isDragging, setIsDragging] = useState(false);
  
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

  // Calculate position in pixels based on booking time (15-minute segments = 60px each)
  const calculateLeftPixels = () => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [bookingHour, bookingMin] = booking.booking_time.split(':').map(Number);
    
    const startTotalMin = startHour * 60 + startMin;
    const bookingTotalMin = bookingHour * 60 + bookingMin;
    const diffMin = Math.max(0, bookingTotalMin - startTotalMin);
    
    // Each 15-minute slot is 60px wide
    return (diffMin / 15) * 60;
  };

  const leftPixels = calculateLeftPixels();
  
  // Calculate width in pixels based on actual duration or end_time if finished
  const getActualDuration = () => {
    if (booking.status === 'finished' && booking.end_time) {
      // Calculate actual duration from booking_time to end_time
      const [bookingHour, bookingMin] = booking.booking_time.split(':').map(Number);
      const [endHour, endMin] = booking.end_time.split(':').map(Number);
      
      const bookingTotalMin = bookingHour * 60 + bookingMin;
      const endTotalMin = endHour * 60 + endMin;
      
      return Math.max(30, endTotalMin - bookingTotalMin); // Minimum 30 minutes
    }
    
    return booking.duration_minutes || 120;
  };

  const duration = getActualDuration();
  // Convert duration to pixels (each 15-minute slot = 60px)
  const widthPixels = (duration / 15) * 60;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify(booking));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent walk-in popup from opening
    onBookingClick(booking);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`absolute rounded-md text-white text-xs flex items-center px-3 cursor-pointer transition-all duration-200 shadow-lg border-l-4 min-h-[44px] ${getStatusColor(booking.status)} ${isDragging ? 'opacity-50' : ''}`}
            style={{
              left: `${leftPixels}px`,
              width: `${widthPixels}px`,
              top: '4px',
              zIndex: 10
            }}
            onClick={handleClick}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
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
                {booking.requires_payment && (
                  <DollarSign className="h-3 w-3 text-green-400" />
                )}
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
                <span>
                  {booking.booking_time}
                  {booking.end_time && booking.status === 'finished' && 
                    ` - ${booking.end_time}`
                  } ({formatDuration(duration)})
                </span>
              </div>
              {booking.booking_reference && (
                <div><strong>ID:</strong> {booking.booking_reference}</div>
              )}
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
