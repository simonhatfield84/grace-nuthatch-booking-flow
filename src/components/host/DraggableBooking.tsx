
import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { DollarSign } from 'lucide-react';

interface DraggableBookingProps {
  booking: any;
  index: number;
  position: { left: number; width: number };
  onBookingClick: (booking: any) => void;
  getBookingStatusColor: (status: string) => string;
  rowHeight: number;
}

export const DraggableBooking = ({ 
  booking, 
  index, 
  position, 
  onBookingClick, 
  getBookingStatusColor,
  rowHeight
}: DraggableBookingProps) => {
  const draggableId = `booking-${booking.id}`;
  
  return (
    <Draggable draggableId={draggableId} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`absolute rounded-xl text-sm p-3 cursor-pointer transition-all duration-200 shadow-lg ${getBookingStatusColor(booking.status)} z-10 font-inter ${
            snapshot.isDragging ? 'shadow-2xl scale-105 rotate-1' : 'hover:shadow-xl hover:scale-102'
          }`}
          style={{
            left: `${position.left}px`,
            width: `${position.width}px`,
            top: '4px',
            height: `${rowHeight - 8}px`,
            ...provided.draggableProps.style,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onBookingClick(booking);
          }}
        >
          <div className="flex items-center justify-between h-full">
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate text-sm flex items-center gap-2">
                <span className="font-semibold font-inter">{booking.guest_name}</span>
                <span className="font-normal font-inter">({booking.party_size})</span>
                {booking.deposit_per_guest > 0 && (
                  <DollarSign className="h-3 w-3 opacity-80" />
                )}
              </div>
            </div>
            {booking.service && (
              <div className="text-xs opacity-90 ml-2 flex-shrink-0 font-medium font-inter">
                {booking.service}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};
