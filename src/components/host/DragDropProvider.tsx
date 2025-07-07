
import React from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';

interface DragDropProviderProps {
  children: React.ReactNode;
  onBookingDrag: (bookingId: number, newTime: string, newTableId: number) => void;
}

export const DragDropProvider = ({ children, onBookingDrag }: DragDropProviderProps) => {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const bookingId = parseInt(result.draggableId.replace('booking-', ''));
    const [tableId, timeSlot] = result.destination.droppableId.replace('drop-', '').split('-');
    
    onBookingDrag(bookingId, timeSlot, parseInt(tableId));
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {children}
    </DragDropContext>
  );
};
