
import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { DollarSign } from 'lucide-react';

interface DraggableBookingProps {
  booking: any;
  index: number;
  position: { left: number; width: number };
  onBookingClick: (booking: any) => void;
  getBookingStatusColor: (status: string) => string;
}

export const DraggableBooking = ({ 
  booking, 
  index, 
  position, 
  onBookingClick, 
  getBookingStatusColor 
}: DraggableBookingProps) => {
  const draggableId = `booking-${booking.id}`;
  
  return (
    <Draggable draggableId={draggableId} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`absolute rounded text-xs p-1 cursor-pointer transition-all shadow-sm border ${getBookingStatusColor(booking.status)} z-10 ${
            snapshot.isDragging ? 'shadow-lg scale-105' : ''
          }`}
          style={{
            left: `${position.left}px`,
            width: `${position.width}px`,
            top: '2px',
            height: '32px',
            ...provided.draggableProps.style,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onBookingClick(booking);
          }}
        >
          <div className="flex items-center justify-between h-full">
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate text-xs flex items-center gap-1">
                {booking.guest_name} ({booking.party_size})
                {booking.deposit_per_guest > 0 && (
                  <DollarSign className="h-3 w-3" />
                )}
              </div>
            </div>
            {booking.service && (
              <div className="text-xs opacity-90 ml-2 flex-shrink-0">
                {booking.service}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};
