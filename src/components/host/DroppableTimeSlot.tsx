
import React from 'react';
import { Droppable } from '@hello-pangea/dnd';

interface DroppableTimeSlotProps {
  tableId: number;
  timeSlot: string;
  slotIndex: number;
  hasBooking: boolean;
  onWalkInClick: (tableId: number, time: string) => void;
  SLOT_WIDTH: number;
}

export const DroppableTimeSlot = ({ 
  tableId, 
  timeSlot, 
  slotIndex, 
  hasBooking, 
  onWalkInClick, 
  SLOT_WIDTH 
}: DroppableTimeSlotProps) => {
  return (
    <Droppable droppableId={`drop-${tableId}-${timeSlot}`}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`border-r border-gray-200 hover:bg-blue-50 cursor-pointer flex items-center justify-center relative ${
            snapshot.isDraggedOver ? 'bg-blue-100' : ''
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
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};
