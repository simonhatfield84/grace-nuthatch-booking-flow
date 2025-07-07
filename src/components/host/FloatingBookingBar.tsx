
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingBookingBarProps {
  booking: any;
  startTime: string;
  timeSlots: string[];
  slotWidth: number;
  onBookingClick: (booking: any) => void;
  onBookingDrag: (bookingId: number, newTime: string, newTableId: number) => void;
  compact?: boolean;
}

export const FloatingBookingBar = ({
  booking,
  startTime,
  timeSlots,
  slotWidth,
  onBookingClick,
  onBookingDrag,
  compact = false
}: FloatingBookingBarProps) => {
  const [isDragging, setIsDragging] = useState(false);

  // Calculate position and width based on the grid system
  const calculatePosition = () => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [bookingHour, bookingMin] = booking.booking_time.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const bookingMinutes = bookingHour * 60 + bookingMin;
    const offsetMinutes = bookingMinutes - startMinutes;
    
    // Find the slot index for positioning
    const slotIndex = Math.floor(offsetMinutes / 15);
    const leftPosition = slotIndex * slotWidth;
    
    // Duration in minutes (default 120 if not specified)
    const duration = booking.duration_minutes || 120;
    const slotsNeeded = Math.ceil(duration / 15);
    const width = slotsNeeded * slotWidth;
    
    // Ensure the booking doesn't overflow the container
    const maxWidth = (timeSlots.length - slotIndex) * slotWidth;
    const finalWidth = Math.min(width, maxWidth);
    
    return { 
      left: Math.max(0, leftPosition), 
      width: Math.max(slotWidth, finalWidth) 
    };
  };

  const { left, width } = calculatePosition();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-500';
      case 'seated':
        return 'bg-green-500';
      case 'finished':
        return 'bg-gray-500';
      case 'late':
        return 'bg-orange-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify(booking));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      data-booking
      className={cn(
        "absolute top-1 rounded-md shadow-sm border cursor-pointer transition-all hover:shadow-md z-10",
        getStatusColor(booking.status),
        compact ? "h-12" : "h-14",
        isDragging && "opacity-50"
      )}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        maxWidth: '100%'
      }}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        onBookingClick(booking);
      }}
    >
      <div className={cn(
        "p-1.5 text-white overflow-hidden h-full",
        compact ? "text-xs" : "text-sm"
      )}>
        <div className="font-medium truncate">
          {booking.guest_name}
        </div>
        <div className={cn(
          "flex items-center gap-1 opacity-90",
          compact ? "text-xs" : "text-xs"
        )}>
          <Users className="h-3 w-3 flex-shrink-0" />
          <span>{booking.party_size}</span>
          <Clock className="h-3 w-3 flex-shrink-0 ml-1" />
          <span>{booking.booking_time}</span>
        </div>
        {!compact && booking.status && (
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs mt-1 bg-white/20 text-white border-white/30",
              compact && "hidden"
            )}
          >
            {booking.status}
          </Badge>
        )}
      </div>
    </div>
  );
};
