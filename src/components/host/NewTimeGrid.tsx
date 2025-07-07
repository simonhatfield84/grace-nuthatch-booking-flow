
import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DragDropProvider } from "./DragDropProvider";
import { DroppableTimeSlot } from "./DroppableTimeSlot";
import { DraggableBooking } from "./DraggableBooking";
import { Ban, Users, Clock, CheckCircle } from "lucide-react";
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
  remainingBookings: number;
  currentlySeated: number;
  finishedBookings: number;
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
  selectedDate,
  remainingBookings,
  currentlySeated,
  finishedBookings
}: TimeGridProps) => {
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [keyHours, setKeyHours] = useState<string[]>([]);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { blocks } = useBlocks(format(selectedDate, 'yyyy-MM-dd'));

  console.log('TimeGrid render:', { bookings: bookings.length, tables: tables.length });

  // Filter out cancelled bookings and no-shows from the grid
  const activeBookings = bookings.filter(booking => 
    booking.status !== 'cancelled' && booking.status !== 'no-show'
  );

  // Calculate statistics for header
  const totalBookings = bookings.length;
  
  // Generate 15-minute time slots and key hours
  useEffect(() => {
    const slots: string[] = [];
    const keys: string[] = [];
    const startHour = 12;
    const endHour = 23;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      keys.push(`${hour.toString().padStart(2, '0')}:00`);
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    setTimeSlots(slots);
    setKeyHours(keys);
  }, []);

  // Group tables by section - ensure all tables are included
  const tablesBySection = sections.map(section => ({
    ...section,
    tables: tables.filter(table => table.section_id === section.id && table.status === 'active')
      .sort((a, b) => a.priority_rank - b.priority_rank)
  })).filter(section => section.tables.length > 0);

  // Calculate fixed row height to fit all content without scroll
  const totalRows = tablesBySection.reduce((acc, section) => {
    return acc + 1 + section.tables.length; // section header + tables
  }, 0);
  
  const headerHeight = 64;
  const availableHeight = typeof window !== 'undefined' ? window.innerHeight - 400 : 600; // Adjusted for AdminLayout
  const calculatedRowHeight = totalRows > 0 ? Math.floor((availableHeight - headerHeight) / totalRows) : 60;
  const rowHeight = Math.max(48, Math.min(70, calculatedRowHeight)); // Min 48px, max 70px

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-200 shadow-sm';
      case 'seated': return 'bg-green-100 hover:bg-green-200 text-green-900 border border-green-200 shadow-sm';
      case 'finished': return 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200 shadow-sm';
      case 'late': return 'bg-orange-100 hover:bg-orange-200 text-orange-900 border border-orange-200 shadow-sm';
      case 'no-show': return 'bg-red-100 hover:bg-red-200 text-red-900 border border-red-200 shadow-sm';
      default: return 'bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-200 shadow-sm';
    }
  };

  const getBookingForSlot = (tableId: number, timeSlot: string) => {
    return activeBookings.find(booking => {
      if (booking.table_id !== tableId) return false;
      
      const bookingTime = booking.booking_time.substring(0, 5);
      return bookingTime === timeSlot; // Only render at the start slot
    });
  };

  const getBookingSpan = (booking: any) => {
    const duration = booking.duration_minutes || 120;
    return Math.ceil(duration / 15);
  };

  const isBookingSlot = (tableId: number, timeSlot: string) => {
    return activeBookings.some(booking => {
      if (booking.table_id !== tableId) return false;
      
      const bookingTime = booking.booking_time.substring(0, 5);
      const duration = booking.duration_minutes || 120;
      const bookingStartIndex = timeSlots.findIndex(slot => slot === bookingTime);
      const currentSlotIndex = timeSlots.findIndex(slot => slot === timeSlot);
      const slotsSpanned = Math.ceil(duration / 15);
      
      return currentSlotIndex >= bookingStartIndex && 
             currentSlotIndex < bookingStartIndex + slotsSpanned;
    });
  };

  const handleBlockClick = (block: Block) => {
    if (onBlockClick) {
      onBlockClick(block);
    }
  };

  const SLOT_WIDTH = 40;
  const TABLE_LABEL_WIDTH = 160;

  return (
    <DragDropProvider onBookingDrag={onBookingDrag || (() => {})}>
      <div 
        ref={gridContainerRef} 
        className="h-full flex flex-col bg-card rounded-lg overflow-hidden border shadow-sm"
      >
        {/* Time slots header */}
        <div className="flex bg-muted border-b" style={{ height: '48px' }}>
          <div 
            className="bg-muted border-r flex items-center justify-center"
            style={{ width: TABLE_LABEL_WIDTH, minWidth: TABLE_LABEL_WIDTH }}
          />
          
          <div 
            className="flex-1 overflow-x-auto scrollbar-hide"
            ref={scrollContainerRef}
          >
            <div 
              className="flex bg-muted"
              style={{ width: timeSlots.length * SLOT_WIDTH, minWidth: timeSlots.length * SLOT_WIDTH }}
            >
              {timeSlots.map((slot) => {
                const isKeyHour = keyHours.includes(slot);
                return (
                  <div 
                    key={`header-${slot}`}
                    className="bg-muted border-r border-border/50 p-2 text-center flex items-center justify-center"
                    style={{ width: SLOT_WIDTH, minWidth: SLOT_WIDTH }}
                  >
                    {isKeyHour && (
                      <span className="text-xs font-medium text-foreground/90">{slot}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main content area - no vertical scroll, fixed height */}
        <div className="flex-1 flex overflow-hidden">
          <div 
            className="bg-muted border-r overflow-hidden"
            style={{ width: TABLE_LABEL_WIDTH, minWidth: TABLE_LABEL_WIDTH }}
          >
            {tablesBySection.map((section) => (
              <div key={section.id}>
                {/* Section Header */}
                <div 
                  className="bg-muted border-b border-border/50 py-3 px-4 flex items-center justify-center" 
                  style={{ height: `${rowHeight}px` }}
                >
                  <div className="flex items-center justify-center gap-3 w-full">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm" 
                      style={{ backgroundColor: section.color }}
                    />
                    <span className="text-sm font-semibold text-foreground truncate">{section.name}</span>
                    <Badge className="text-xs bg-background/50 text-foreground px-2 py-1 flex-shrink-0 border-0 rounded-full">
                      {section.tables.length}
                    </Badge>
                  </div>
                </div>

                {/* Table rows */}
                {section.tables.map((table) => (
                  <div 
                    key={table.id} 
                    className="border-b border-border/50 p-4 bg-background hover:bg-muted/50 transition-all duration-200 flex items-center justify-center text-center rounded-lg mx-2 my-1 shadow-sm"
                    style={{ height: `${rowHeight}px` }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-medium text-foreground">{table.label}</span>
                      <span className="text-xs text-muted-foreground">({table.seats})</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div 
            className="flex-1 overflow-x-auto overflow-y-hidden"
            onScroll={(e) => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollLeft = e.currentTarget.scrollLeft;
              }
            }}
          >
            <div style={{ width: timeSlots.length * SLOT_WIDTH }}>
              {tablesBySection.map((section) => (
                <div key={section.id}>
                  {/* Section header row */}
                  <div 
                    className="bg-muted border-b border-border/50 flex"
                    style={{ height: `${rowHeight}px` }}
                  >
                    {timeSlots.map((slot) => (
                      <div 
                        key={`section-${section.id}-${slot}`}
                        className="border-r border-border/50"
                        style={{ width: SLOT_WIDTH, minWidth: SLOT_WIDTH }}
                      />
                    ))}
                  </div>

                  {/* Table rows with integrated booking rendering */}
                  {section.tables.map((table) => (
                    <div 
                      key={table.id} 
                      className="relative flex border-b border-border/50 bg-background hover:bg-muted/30 transition-all duration-200 mx-2 my-1 rounded-lg shadow-sm"
                      style={{ height: `${rowHeight}px` }}
                    >
                      {/* Time slot cells with integrated drag and drop */}
                      {timeSlots.map((slot, slotIndex) => {
                        const booking = getBookingForSlot(table.id, slot);
                        const hasBooking = isBookingSlot(table.id, slot);

                        return (
                          <DroppableTimeSlot
                            key={`${table.id}-${slot}`}
                            tableId={table.id}
                            timeSlot={slot}
                            slotIndex={slotIndex}
                            hasBooking={hasBooking}
                            onWalkInClick={onWalkInClick}
                            SLOT_WIDTH={SLOT_WIDTH}
                            rowHeight={rowHeight}
                          >
                            {booking && (
                              <DraggableBooking
                                key={booking.id}
                                booking={booking}
                                index={0}
                                position={{ 
                                  left: 0, 
                                  width: getBookingSpan(booking) * SLOT_WIDTH - 4 
                                }}
                                onBookingClick={onBookingClick}
                                getBookingStatusColor={getBookingStatusColor}
                                rowHeight={rowHeight}
                              />
                            )}
                          </DroppableTimeSlot>
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
                          const leftPixels = startIndex * SLOT_WIDTH;
                          const widthPixels = (durationMin / 15) * SLOT_WIDTH;

                          return (
                            <div
                              key={block.id}
                              className="absolute bg-red-100/60 hover:bg-red-100/80 border border-red-300 rounded-lg flex items-center justify-center z-20 cursor-pointer transition-all duration-200 shadow-lg"
                              style={{
                                left: `${leftPixels}px`,
                                width: `${widthPixels}px`,
                                top: '4px',
                                height: `${rowHeight - 8}px`
                              }}
                              title={`Blocked: ${block.reason || 'No reason specified'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBlockClick(block);
                              }}
                            >
                              <Ban className="h-4 w-4 text-red-600" strokeWidth={2} />
                            </div>
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
