
import React from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';

interface DragDropProviderProps {
  children: React.ReactNode;
  onBookingDrag: (bookingId: number, newTime: string, newTableId: number) => void;
}

export const DragDropProvider = ({ children, onBookingDrag }: DragDropProviderProps) => {
  const handleDragEnd = (result: DropResult) => {
    console.log('Drag ended:', result);
    
    if (!result.destination) {
      console.log('No destination for drag');
      return;
    }

    try {
      const bookingId = parseInt(result.draggableId.replace('booking-', ''));
      const destinationParts = result.destination.droppableId.replace('drop-', '').split('-');
      
      if (destinationParts.length < 2) {
        console.error('Invalid destination format:', result.destination.droppableId);
        return;
      }
      
      const tableId = parseInt(destinationParts[0]);
      const timeSlot = destinationParts.slice(1).join('-');
      
      console.log('Parsed drag data:', { bookingId, tableId, timeSlot });
      
      if (isNaN(bookingId) || isNaN(tableId)) {
        console.error('Invalid booking or table ID');
        return;
      }
      
      onBookingDrag(bookingId, timeSlot, tableId);
    } catch (error) {
      console.error('Error handling drag end:', error);
    }
  };

  const handleDragStart = (start: any) => {
    console.log('Drag started:', start);
  };

  const handleDragUpdate = (update: any) => {
    // Reduced logging for performance
    if (update.destination) {
      console.log('Drag over:', update.destination.droppableId);
    }
  };

  return (
    <DragDropContext 
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      onDragUpdate={handleDragUpdate}
    >
      {children}
    </DragDropContext>
  );
};
