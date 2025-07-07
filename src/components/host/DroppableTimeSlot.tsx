
import React from 'react';
import { Droppable } from '@hello-pangea/dnd';

interface DroppableTimeSlotProps {
  tableId: number;
  timeSlot: string;
  slotIndex: number;
  hasBooking: boolean;
  onWalkInClick: (tableId: number, time: string) => void;
  SLOT_WIDTH: number;
  rowHeight: number;
}

export const DroppableTimeSlot = ({ 
  tableId, 
  timeSlot, 
  slotIndex, 
  hasBooking, 
  onWalkInClick,
  SLOT_WIDTH,
  rowHeight
}: DroppableTimeSlotProps) => {
  const droppableId = `drop-${tableId}-${timeSlot}`;
  
  return (
    <Droppable droppableId={droppableId}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`border-r border-host-mid-gray/10 hover:bg-host-mint/10 cursor-pointer flex items-center justify-center relative transition-all duration-200 ${
            snapshot.isDraggingOver ? 'bg-host-mint/20 border-host-mint/40' : ''
          }`}
          style={{ width: SLOT_WIDTH, minWidth: SLOT_WIDTH, height: `${rowHeight}px` }}
          onClick={() => {
            if (!hasBooking) {
              onWalkInClick(tableId, timeSlot);
            }
          }}
        >
          {!hasBooking && (
            <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
              <span className="text-xs text-host-mint font-medium">+</span>
            </div>
          )}
          
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};
