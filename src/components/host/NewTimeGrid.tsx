
import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DragDropProvider } from "./DragDropProvider";
import { DroppableTimeSlot } from "./DroppableTimeSlot";
import { DraggableBooking } from "./DraggableBooking";
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
  const [dynamicRowHeight, setDynamicRowHeight] = useState(44);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const { blocks } = useBlocks(format(selectedDate, 'yyyy-MM-dd'));

  console.log('TimeGrid render:', { bookings: bookings.length, tables: tables.length });

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

  // Calculate dynamic row height based on available space (iPad optimized)
  useEffect(() => {
    const calculateRowHeight = () => {
      if (!gridContainerRef.current) return;
      
      const container = gridContainerRef.current;
      const containerHeight = container.clientHeight;
      const headerHeight = 56; // Larger header for iPad
      
      const totalRows = tablesBySection.reduce((acc, section) => {
        return acc + 1 + section.tables.length;
      }, 0);
      
      if (totalRows === 0) return;
      
      const availableHeight = containerHeight - headerHeight;
      const calculatedHeight = Math.floor(availableHeight / totalRows);
      
      // iPad-optimized touch targets: min 44px, max 72px
      const minHeight = 44;
      const maxHeight = 72;
      const newHeight = Math.max(minHeight, Math.min(maxHeight, calculatedHeight));
      
      setDynamicRowHeight(newHeight);
    };

    calculateRowHeight();
    
    const resizeObserver = new ResizeObserver(calculateRowHeight);
    if (gridContainerRef.current) {
      resizeObserver.observe(gridContainerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, [tables, sections]);

  // Group tables by section
  const tablesBySection = sections.map(section => ({
    ...section,
    tables: tables.filter(table => table.section_id === section.id)
      .sort((a, b) => a.priority_rank - b.priority_rank)
  })).filter(section => section.tables.length > 0);

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-host-status-confirmed hover:bg-host-sky-blue text-host-blackest-dark border border-host-sky-blue/20';
      case 'seated': return 'bg-host-status-seated hover:bg-host-mint text-host-blackest-dark border border-host-mint/20';
      case 'finished': return 'bg-host-status-finished hover:bg-host-mid-gray text-host-white border border-host-mid-gray/20';
      case 'late': return 'bg-host-status-late hover:bg-host-blush text-host-blackest-dark border border-host-blush/20';
      case 'no-show': return 'bg-host-status-error hover:bg-red-400 text-host-white border border-host-status-error/20';
      default: return 'bg-host-status-confirmed hover:bg-host-sky-blue text-host-blackest-dark border border-host-sky-blue/20';
    }
  };

  const getBookingPosition = (booking: any, timeSlots: string[]) => {
    const bookingTime = booking.booking_time.substring(0, 5);
    const duration = booking.duration_minutes || 120;
    
    const startIndex = timeSlots.findIndex(slot => slot === bookingTime);
    if (startIndex === -1) return null;
    
    const slotsSpanned = Math.ceil(duration / 15);
    const left = startIndex * SLOT_WIDTH;
    const width = slotsSpanned * SLOT_WIDTH - 2;
    
    return { left, width };
  };

  const handleBlockClick = (block: Block) => {
    if (onBlockClick) {
      onBlockClick(block);
    }
  };

  const SLOT_WIDTH = 28; // Reduced from 40px to eliminate horizontal scroll
  const TABLE_LABEL_WIDTH = 140; // Increased for better iPad touch targets

  return (
    <DragDropProvider onBookingDrag={onBookingDrag || (() => {})}>
      <div 
        ref={gridContainerRef} 
        className="h-full flex flex-col bg-host-blackest-dark rounded-xl overflow-hidden border border-host-dark-gray shadow-2xl font-inter"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        {/* Fixed header with iPad-native styling */}
        <div className="flex bg-host-dark-gray border-b border-host-mid-gray/20 shadow-lg" style={{ height: '56px' }}>
          <div 
            className="bg-host-dark-gray border-r border-host-mid-gray/20 p-3 flex items-center justify-center"
            style={{ width: TABLE_LABEL_WIDTH, minWidth: TABLE_LABEL_WIDTH }}
          >
            <span className="text-sm font-semibold text-host-white">Tables</span>
          </div>
          
          <div 
            className="flex-1 overflow-x-auto scrollbar-hide"
            ref={scrollContainerRef}
            style={{ width: `calc(100% - ${TABLE_LABEL_WIDTH}px)` }}
          >
            <div 
              className="flex bg-host-dark-gray"
              style={{ width: timeSlots.length * SLOT_WIDTH, minWidth: timeSlots.length * SLOT_WIDTH }}
            >
              {timeSlots.map((slot) => (
                <div 
                  key={`header-${slot}`}
                  className="bg-host-dark-gray border-r border-host-mid-gray/10 p-2 text-center flex items-center justify-center"
                  style={{ width: SLOT_WIDTH, minWidth: SLOT_WIDTH }}
                >
                  <span className="text-xs font-medium text-host-white/90">{slot}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable content with iPad-optimized styling */}
        <div className="flex-1 flex overflow-hidden">
          <div 
            className="bg-host-dark-gray overflow-y-auto border-r border-host-mid-gray/20 scrollbar-hide"
            style={{ width: TABLE_LABEL_WIDTH, minWidth: TABLE_LABEL_WIDTH }}
          >
            {tablesBySection.map((section) => (
              <div key={section.id}>
                {/* Section Header with iPad card-style */}
                <div 
                  className="bg-host-dark-gray border-b border-host-mid-gray/20 py-2 px-3 flex items-center justify-center" 
                  style={{ height: `${dynamicRowHeight}px` }}
                >
                  <div className="flex items-center justify-center gap-3 w-full">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" 
                      style={{ backgroundColor: section.color }}
                    />
                    <span className="text-sm font-semibold text-host-white truncate">{section.name}</span>
                    <Badge className="text-xs bg-host-mid-gray/20 text-host-white px-2 py-0 flex-shrink-0 border-0">
                      {section.tables.length}
                    </Badge>
                  </div>
                </div>

                {/* Table rows with iPad touch optimization */}
                {section.tables.map((table) => (
                  <div 
                    key={table.id} 
                    className="border-b border-host-mid-gray/10 p-3 bg-host-blackest-dark hover:bg-host-dark-gray/50 transition-all duration-200 flex items-center justify-center text-center rounded-sm mx-1 my-0.5"
                    style={{ height: `${dynamicRowHeight}px` }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-medium text-host-white">{table.label}</span>
                      <span className="text-xs text-host-mid-gray">({table.seats})</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div 
            className="flex-1 overflow-x-auto overflow-y-auto scrollbar-hide"
            onScroll={(e) => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollLeft = e.currentTarget.scrollLeft;
              }
            }}
          >
            <div style={{ width: timeSlots.length * SLOT_WIDTH, minWidth: timeSlots.length * SLOT_WIDTH }}>
              {tablesBySection.map((section) => (
                <div key={section.id}>
                  {/* Section header row */}
                  <div 
                    className="bg-host-dark-gray border-b border-host-mid-gray/20 flex"
                    style={{ height: `${dynamicRowHeight}px` }}
                  >
                    {timeSlots.map((slot) => (
                      <div 
                        key={`section-${section.id}-${slot}`}
                        className="border-r border-host-mid-gray/10"
                        style={{ width: SLOT_WIDTH, minWidth: SLOT_WIDTH }}
                      />
                    ))}
                  </div>

                  {/* Table rows with bookings rendered at row level */}
                  {section.tables.map((table) => (
                    <div 
                      key={table.id} 
                      className="relative flex border-b border-host-mid-gray/10 bg-host-blackest-dark hover:bg-host-dark-gray/30 transition-all duration-200 mx-1 my-0.5 rounded-sm"
                      style={{ height: `${dynamicRowHeight}px` }}
                    >
                      {/* Time slot cells with drag and drop */}
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
                            rowHeight={dynamicRowHeight}
                          />
                        );
                      })}

                      {/* Render bookings at row level (single instance each) */}
                      {activeBookings
                        .filter(booking => booking.table_id === table.id)
                        .map((booking, bookingIndex) => {
                          const position = getBookingPosition(booking, timeSlots);
                          if (!position) return null;
                          
                          return (
                            <DraggableBooking
                              key={booking.id}
                              booking={booking}
                              index={bookingIndex}
                              position={position}
                              onBookingClick={onBookingClick}
                              getBookingStatusColor={getBookingStatusColor}
                              rowHeight={dynamicRowHeight}
                            />
                          );
                        })}

                      {/* Block overlays with iPad styling */}
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
                              className="absolute bg-host-status-error/40 hover:bg-host-status-error/60 border border-host-status-error rounded-lg flex items-center justify-center z-20 cursor-pointer transition-all duration-200 shadow-sm"
                              style={{
                                left: `${leftPixels}px`,
                                width: `${widthPixels}px`,
                                top: '2px',
                                height: `${dynamicRowHeight - 4}px`
                              }}
                              title={`Blocked: ${block.reason || 'No reason specified'}`}
                              onClick={() => handleBlockClick(block)}
                            >
                              <Ban className="h-4 w-4 text-host-white" strokeWidth={2} />
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
