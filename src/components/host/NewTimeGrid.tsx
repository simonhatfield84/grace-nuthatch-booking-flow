
import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { BlockOverlay } from "./BlockOverlay";
import { DragDropProvider } from "./DragDropProvider";
import { DraggableBooking } from "./DraggableBooking";
import { DroppableTimeSlot } from "./DroppableTimeSlot";
import { Ban } from "lucide-react";
import { useBlocks, Block } from "@/hooks/useBlocks";

interface TimeGridProps {
  venueHours: any;
  tables: any[];
  sections: any[];
  bookings: any[];
  onWalkInClick: (tableId: number, time: string) => void;
  onBookingClick: (booking: any) => void;
  onBookingDrag?: (bookingId: number, newTime: string, newTableId: number) => void;
  onBlockClick?: (block: Block) => void;
  selectedDate: Date;
}

export const NewTimeGrid = ({
  venueHours,
  tables,
  sections,
  bookings,
  onWalkInClick,
  onBookingClick,
  onBookingDrag,
  onBlockClick,
  selectedDate
}: TimeGridProps) => {
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { blocks } = useBlocks(format(selectedDate, 'yyyy-MM-dd'));

  // Filter out cancelled bookings and no-shows from the grid
  const activeBookings = bookings.filter(booking => 
    booking.status !== 'cancelled' && booking.status !== 'no-show'
  );

  // Generate 15-minute time slots
  useEffect(() => {
    const slots: string[] = [];
    const startHour = 12;
    const endHour = 23;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    setTimeSlots(slots);
  }, []);

  // Group tables by section
  const tablesBySection = sections.map(section => ({
    ...section,
    tables: tables.filter(table => table.section_id === section.id)
      .sort((a, b) => a.priority_rank - b.priority_rank)
  })).filter(section => section.tables.length > 0);

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600';
      case 'seated': return 'bg-green-500 hover:bg-green-600 text-white border-green-600';
      case 'finished': return 'bg-gray-500 hover:bg-gray-600 text-white border-gray-600';
      case 'late': return 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600';
      case 'no-show': return 'bg-red-500 hover:bg-red-600 text-white border-red-600';
      default: return 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600';
    }
  };

  const getBookingPosition = (booking: any) => {
    const bookingTime = booking.booking_time.substring(0, 5);
    const duration = booking.duration_minutes || 120;
    
    const startIndex = timeSlots.findIndex(slot => slot === bookingTime);
    if (startIndex === -1) return null;
    
    const slotsSpanned = Math.ceil(duration / 15);
    const left = startIndex * 40;
    const width = slotsSpanned * 40 - 2;
    
    return { left, width };
  };

  const handleBlockClick = (block: Block) => {
    if (onBlockClick) {
      onBlockClick(block);
    }
  };

  const SLOT_WIDTH = 40;
  const TABLE_LABEL_WIDTH = 120;
  const GRID_WIDTH = timeSlots.length * SLOT_WIDTH;

  return (
    <DragDropProvider onBookingDrag={onBookingDrag || (() => {})}>
      <div className="h-full flex flex-col bg-gray-50 rounded-lg overflow-hidden border border-gray-300">
        {/* Fixed header */}
        <div className="flex bg-gray-100 border-b-2 border-gray-300 shadow-sm">
          <div 
            className="bg-gray-200 border-r-2 border-gray-300 p-2 flex items-center justify-center"
            style={{ width: TABLE_LABEL_WIDTH, minWidth: TABLE_LABEL_WIDTH }}
          >
            <span className="text-sm font-semibold text-gray-800">Tables</span>
          </div>
          
          <div 
            className="flex-1 overflow-x-auto"
            ref={scrollContainerRef}
            style={{ width: `calc(100% - ${TABLE_LABEL_WIDTH}px)` }}
          >
            <div 
              className="flex bg-gray-200"
              style={{ width: GRID_WIDTH, minWidth: GRID_WIDTH }}
            >
              {timeSlots.map((slot) => (
                <div 
                  key={`header-${slot}`}
                  className="bg-gray-200 border-r border-gray-400 p-1 text-center flex items-center justify-center"
                  style={{ width: SLOT_WIDTH, minWidth: SLOT_WIDTH }}
                >
                  <span className="text-xs font-medium text-gray-800">{slot}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 flex overflow-hidden">
          <div 
            className="bg-gray-100 overflow-y-auto border-r-2 border-gray-300"
            style={{ width: TABLE_LABEL_WIDTH, minWidth: TABLE_LABEL_WIDTH }}
          >
            {tablesBySection.map((section) => (
              <div key={section.id}>
                {/* Section Header */}
                <div className="bg-gray-200 border-b border-gray-400 py-1 px-2 text-center" style={{ height: '28px' }}>
                  <div className="flex items-center justify-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: section.color }}
                    />
                    <span className="text-xs font-bold text-gray-900">{section.name}</span>
                    <Badge variant="secondary" className="text-xs bg-gray-300 text-gray-800 px-1 py-0">
                      {section.tables.length}
                    </Badge>
                  </div>
                </div>

                {/* Table rows */}
                {section.tables.map((table) => (
                  <div 
                    key={table.id} 
                    className="border-b border-gray-300 p-1 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center text-center"
                    style={{ height: '28px' }}
                  >
                    <div>
                      <span className="text-xs font-semibold text-gray-900">{table.label}</span>
                      <span className="text-xs text-gray-600 ml-1">({table.seats})</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div 
            className="flex-1 overflow-x-auto overflow-y-auto"
            onScroll={(e) => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollLeft = e.currentTarget.scrollLeft;
              }
            }}
          >
            <div style={{ width: GRID_WIDTH, minWidth: GRID_WIDTH }}>
              {tablesBySection.map((section) => (
                <div key={section.id}>
                  {/* Section header row */}
                  <div 
                    className="bg-gray-200 border-b border-gray-400 flex"
                    style={{ height: '28px' }}
                  >
                    {timeSlots.map((slot) => (
                      <div 
                        key={`section-${section.id}-${slot}`}
                        className="border-r border-gray-300"
                        style={{ width: SLOT_WIDTH, minWidth: SLOT_WIDTH }}
                      />
                    ))}
                  </div>

                  {/* Table rows */}
                  {section.tables.map((table, tableIndex) => (
                    <div 
                      key={table.id} 
                      className="relative flex border-b border-gray-300 bg-white"
                      style={{ height: '28px' }}
                    >
                      {/* Time slot cells */}
                      {timeSlots.map((slot, slotIndex) => {
                        const hasBooking = activeBookings.some(booking => {
                          if (booking.table_id !== table.id) return false;
                          const bookingStart = booking.booking_time.substring(0, 5);
                          const duration = booking.duration_minutes || 120;
                          const bookingStartIndex = timeSlots.findIndex(s => s === bookingStart);
                          const slotsSpanned = Math.ceil(duration / 15);
                          
                          return slotIndex >= bookingStartIndex && 
                                 slotIndex < bookingStartIndex + slotsSpanned;
                        });

                        return (
                          <DroppableTimeSlot
                            key={`${table.id}-${slot}`}
                            tableId={table.id}
                            timeSlot={slot}
                            slotIndex={slotIndex}
                            hasBooking={hasBooking}
                            onWalkInClick={onWalkInClick}
                            SLOT_WIDTH={SLOT_WIDTH}
                          />
                        );
                      })}

                      {/* Block overlays */}
                      {blocks
                        .filter(block => 
                          block.table_ids.length === 0 || block.table_ids.includes(table.id)
                        )
                        .map((block) => {
                          const startIndex = timeSlots.findIndex(slot => slot === block.start_time);
                          const [startHour, startMin] = block.start_time.split(':').map(Number);
                          const [endHour, endMin] = block.end_time.split(':').map(Number);
                          const startTotalMin = startHour * 60 + startMin;
                          const endTotalMin = endHour * 60 + endMin;
                          const durationMin = endTotalMin - startTotalMin;
                          const leftPixels = startIndex * 40;
                          const widthPixels = (durationMin / 15) * 40;

                          return (
                            <div
                              key={block.id}
                              className="absolute bg-red-400/40 border border-red-500 rounded flex items-center justify-center z-20 cursor-pointer hover:bg-red-400/60"
                              style={{
                                left: `${leftPixels}px`,
                                width: `${widthPixels}px`,
                                top: '1px',
                                height: '26px'
                              }}
                              title={`Blocked: ${block.reason || 'No reason specified'}`}
                              onClick={() => handleBlockClick(block)}
                            >
                              <Ban className="h-3 w-3 text-red-700" strokeWidth={2} />
                            </div>
                          );
                        })}

                      {/* Bookings */}
                      {activeBookings
                        .filter(booking => booking.table_id === table.id)
                        .map((booking, bookingIndex) => {
                          const position = getBookingPosition(booking);
                          if (!position) return null;
                          
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
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DragDropProvider>
  );
};
