
import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DragDropProvider } from "./DragDropProvider";
import { DroppableTimeSlot } from "./DroppableTimeSlot";
import { DraggableBooking } from "./DraggableBooking";
import { Ban, Users, Clock, Target } from "lucide-react";
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
  const currentlySeated = bookings.filter(booking => booking.status === 'seated').length;
  
  // Calculate remaining capacity (simplified - based on total time slots vs booked slots)
  const totalCapacity = tables.length * timeSlots.length;
  const bookedSlots = activeBookings.reduce((acc, booking) => {
    const duration = booking.duration_minutes || 120;
    const slotsSpanned = Math.ceil(duration / 15);
    return acc + slotsSpanned;
  }, 0);
  const remainingCapacity = Math.max(0, totalCapacity - bookedSlots);

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
  const availableHeight = typeof window !== 'undefined' ? window.innerHeight - 200 : 800; // Account for header and padding
  const calculatedRowHeight = totalRows > 0 ? Math.floor((availableHeight - headerHeight) / totalRows) : 60;
  const rowHeight = Math.max(48, Math.min(70, calculatedRowHeight)); // Min 48px, max 70px

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-[#C2D8E9] hover:bg-[#A8CDE3] text-[#111315] border border-[#C2D8E9]/30 shadow-sm';
      case 'seated': return 'bg-[#CCF0DB] hover:bg-[#B8E8CE] text-[#111315] border border-[#CCF0DB]/30 shadow-sm';
      case 'finished': return 'bg-[#676767] hover:bg-[#5A5A5A] text-white border border-[#676767]/30 shadow-sm';
      case 'late': return 'bg-[#F1C8D0] hover:bg-[#EDBBC5] text-[#111315] border border-[#F1C8D0]/30 shadow-sm';
      case 'no-show': return 'bg-[#E47272] hover:bg-[#DF5F5F] text-white border border-[#E47272]/30 shadow-sm';
      default: return 'bg-[#C2D8E9] hover:bg-[#A8CDE3] text-[#111315] border border-[#C2D8E9]/30 shadow-sm';
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
        className="h-full flex flex-col bg-[#111315] rounded-2xl overflow-hidden border border-[#292C2D] shadow-2xl font-inter"
      >
        {/* Enhanced header with statistics */}
        <div className="flex bg-[#292C2D] border-b border-[#676767]/20 shadow-lg rounded-t-2xl px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-6 text-[#676767]">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#CCF0DB]" />
                <span className="font-inter text-white">{totalBookings} bookings</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#C2D8E9]" />
                <span className="font-inter text-white">{currentlySeated} seated</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-[#676767]" />
                <span className="font-inter text-white">{remainingCapacity} remaining</span>
              </div>
            </div>
            <div className="text-base font-semibold text-white font-inter">Tables</div>
          </div>
        </div>

        {/* Time slots header */}
        <div className="flex bg-[#292C2D] border-b border-[#676767]/20 shadow-lg" style={{ height: '48px' }}>
          <div 
            className="bg-[#292C2D] border-r border-[#676767]/20 flex items-center justify-center"
            style={{ width: TABLE_LABEL_WIDTH, minWidth: TABLE_LABEL_WIDTH }}
          />
          
          <div 
            className="flex-1 overflow-x-auto scrollbar-hide"
            ref={scrollContainerRef}
          >
            <div 
              className="flex bg-[#292C2D]"
              style={{ width: timeSlots.length * SLOT_WIDTH, minWidth: timeSlots.length * SLOT_WIDTH }}
            >
              {timeSlots.map((slot) => {
                const isKeyHour = keyHours.includes(slot);
                return (
                  <div 
                    key={`header-${slot}`}
                    className="bg-[#292C2D] border-r border-[#676767]/10 p-2 text-center flex items-center justify-center"
                    style={{ width: SLOT_WIDTH, minWidth: SLOT_WIDTH }}
                  >
                    {isKeyHour && (
                      <span className="text-xs font-medium text-white/90 font-inter">{slot}</span>
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
            className="bg-[#292C2D] border-r border-[#676767]/20 overflow-hidden"
            style={{ width: TABLE_LABEL_WIDTH, minWidth: TABLE_LABEL_WIDTH }}
          >
            {tablesBySection.map((section) => (
              <div key={section.id}>
                {/* Section Header */}
                <div 
                  className="bg-[#292C2D] border-b border-[#676767]/20 py-3 px-4 flex items-center justify-center" 
                  style={{ height: `${rowHeight}px` }}
                >
                  <div className="flex items-center justify-center gap-3 w-full">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm" 
                      style={{ backgroundColor: section.color }}
                    />
                    <span className="text-sm font-semibold text-white truncate font-inter">{section.name}</span>
                    <Badge className="text-xs bg-[#676767]/30 text-white px-2 py-1 flex-shrink-0 border-0 rounded-full font-inter">
                      {section.tables.length}
                    </Badge>
                  </div>
                </div>

                {/* Table rows */}
                {section.tables.map((table) => (
                  <div 
                    key={table.id} 
                    className="border-b border-[#676767]/10 p-4 bg-[#111315] hover:bg-[#292C2D]/50 transition-all duration-200 flex items-center justify-center text-center rounded-lg mx-2 my-1 shadow-sm"
                    style={{ height: `${rowHeight}px` }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-medium text-white font-inter">{table.label}</span>
                      <span className="text-xs text-[#676767] font-inter">({table.seats})</span>
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
                    className="bg-[#292C2D] border-b border-[#676767]/20 flex"
                    style={{ height: `${rowHeight}px` }}
                  >
                    {timeSlots.map((slot) => (
                      <div 
                        key={`section-${section.id}-${slot}`}
                        className="border-r border-[#676767]/10"
                        style={{ width: SLOT_WIDTH, minWidth: SLOT_WIDTH }}
                      />
                    ))}
                  </div>

                  {/* Table rows with integrated booking rendering */}
                  {section.tables.map((table) => (
                    <div 
                      key={table.id} 
                      className="relative flex border-b border-[#676767]/10 bg-[#111315] hover:bg-[#292C2D]/30 transition-all duration-200 mx-2 my-1 rounded-lg shadow-sm"
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
                              className="absolute bg-[#E47272]/40 hover:bg-[#E47272]/60 border border-[#E47272] rounded-xl flex items-center justify-center z-20 cursor-pointer transition-all duration-200 shadow-lg"
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
                              <Ban className="h-4 w-4 text-white" strokeWidth={2} />
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
