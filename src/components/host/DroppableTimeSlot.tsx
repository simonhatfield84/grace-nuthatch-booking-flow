
import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { DraggableBooking } from './DraggableBooking';

interface DroppableTimeSlotProps {
  tableId: number;
  timeSlot: string;
  slotIndex: number;
  hasBooking: boolean;
  bookings: any[];
  onWalkInClick: (tableId: number, time: string) => void;
  onBookingClick: (booking: any) => void;
  getBookingStatusColor: (status: string) => string;
  getBookingPosition: (booking: any) => { left: number; width: number } | null;
  SLOT_WIDTH: number;
}

export const DroppableTimeSlot = ({ 
  tableId, 
  timeSlot, 
  slotIndex, 
  hasBooking, 
  bookings,
  onWalkInClick,
  onBookingClick,
  getBookingStatusColor,
  getBookingPosition,
  SLOT_WIDTH 
}: DroppableTimeSlotProps) => {
  const droppableId = `drop-${tableId}-${timeSlot}`;
  
  return (
    <Droppable droppableId={droppableId}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`border-r border-gray-200 hover:bg-blue-50 cursor-pointer flex items-center justify-center relative ${
            snapshot.isDraggingOver ? 'bg-blue-100' : ''
          }`}
          style={{ width: SLOT_WIDTH, minWidth: SLOT_WIDTH }}
          onClick={() => {
            if (!hasBooking) {
              onWalkInClick(tableId, timeSlot);
            }
          }}
        >
          {!hasBooking && (
            <div className="opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-xs text-gray-400">+</span>
            </div>
          )}
          
          {/* Render draggable bookings inside this droppable */}
          {bookings
            .filter(booking => booking.table_id === tableId)
            .map((booking, bookingIndex) => {
              const position = getBookingPosition(booking);
              if (!position) return null;
              
              // Check if this booking overlaps with this time slot
              const bookingTime = booking.booking_time.substring(0, 5);
              const duration = booking.duration_minutes || 120;
              const bookingStartIndex = Math.floor((parseInt(bookingTime.split(':')[0]) * 60 + parseInt(bookingTime.split(':')[1]) - 12 * 60) / 15);
              const slotsSpanned = Math.ceil(duration / 15);
              
              const overlapsThisSlot = slotIndex >= bookingStartIndex && slotIndex < bookingStartIndex + slotsSpanned;
              
              if (!overlapsThisSlot) return null;
              
              return (
                <DraggableBooking
                  key={booking.id}
                  booking={booking}
                  index={bookingIndex}
                  position={position}
                  onBookingClick={onBookingClick}
                  getBookingStatusColor={getBookingStatusColor}
                />
              );
            })}
          
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};
