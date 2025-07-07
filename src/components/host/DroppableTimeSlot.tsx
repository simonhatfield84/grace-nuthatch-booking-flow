
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
  children?: React.ReactNode;
}

export const DroppableTimeSlot = ({ 
  tableId, 
  timeSlot, 
  slotIndex, 
  hasBooking, 
  onWalkInClick,
  SLOT_WIDTH,
  rowHeight,
  children
}: DroppableTimeSlotProps) => {
  const droppableId = `drop-${tableId}-${timeSlot}`;
  
  return (
    <Droppable droppableId={droppableId}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`border-r border-[#676767]/10 hover:bg-[#CCF0DB]/10 cursor-pointer flex items-center justify-center relative transition-all duration-200 ${
            snapshot.isDraggingOver ? 'bg-[#CCF0DB]/20 border-[#CCF0DB]/40 shadow-inner' : ''
          }`}
          style={{ width: SLOT_WIDTH, minWidth: SLOT_WIDTH, height: `${rowHeight}px` }}
          onClick={(e) => {
            e.stopPropagation();
            if (!hasBooking) {
              onWalkInClick(tableId, timeSlot);
            }
          }}
        >
          {!hasBooking && (
            <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
              <span className="text-sm text-[#CCF0DB] font-medium font-inter">+</span>
            </div>
          )}
          
          {children}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};
