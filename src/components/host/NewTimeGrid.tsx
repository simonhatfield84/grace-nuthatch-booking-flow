
import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { BlockOverlay } from "./BlockOverlay";
import { DollarSign } from "lucide-react";

interface TimeGridProps {
  venueHours: any;
  tables: any[];
  sections: any[];
  bookings: any[];
  onWalkInClick: (tableId: number, time: string) => void;
  onBookingClick: (booking: any) => void;
  onBookingDrag?: (bookingId: number, newTime: string, newTableId: number) => void;
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
  selectedDate
}: TimeGridProps) => {
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter out cancelled bookings
  const activeBookings = bookings.filter(booking => booking.status !== 'cancelled');

  // Generate 15-minute time slots
  useEffect(() => {
    const slots: string[] = [];
    const startHour = 12; // 12:00 PM
    const endHour = 23; // 11:00 PM
    
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
      case 'finished': return 'bg-gray-400 hover:bg-gray-500 text-white border-gray-500';
      case 'late': return 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600';
      case 'no-show': return 'bg-red-500 hover:bg-red-600 text-white border-red-600';
      default: return 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600';
    }
  };

  // Calculate booking position and width based on time slots and duration
  const getBookingPosition = (booking: any) => {
    const bookingTime = booking.booking_time.substring(0, 5);
    const duration = booking.duration_minutes || 120;
    
    // Find the index of the booking start time
    const startIndex = timeSlots.findIndex(slot => slot === bookingTime);
    if (startIndex === -1) return null;
    
    // Calculate how many 15-minute slots this booking spans
    const slotsSpanned = Math.ceil(duration / 15);
    
    // Calculate position using pixels (40px per slot)
    const left = startIndex * 40;
    const width = slotsSpanned * 40 - 2; // -2px for border spacing
    
    return { left, width };
  };

  const SLOT_WIDTH = 40;
  const TABLE_LABEL_WIDTH = 140;
  const GRID_WIDTH = timeSlots.length * SLOT_WIDTH;

  return (
    <div className="h-full flex flex-col bg-white rounded-lg overflow-hidden border border-gray-200">
      {/* Fixed header with table labels and time slots */}
      <div className="flex bg-gray-50 border-b border-gray-200 shadow-sm">
        {/* Fixed table header */}
        <div 
          className="bg-gray-100 border-r border-gray-300 p-2 flex items-center justify-center"
          style={{ width: TABLE_LABEL_WIDTH, minWidth: TABLE_LABEL_WIDTH }}
        >
          <span className="text-sm font-medium text-gray-700">Tables</span>
        </div>
        
        {/* Scrollable time header container */}
        <div 
          className="flex-1 overflow-x-auto"
          ref={scrollContainerRef}
          style={{ width: `calc(100% - ${TABLE_LABEL_WIDTH}px)` }}
        >
          <div 
            className="flex bg-gray-100"
            style={{ width: GRID_WIDTH, minWidth: GRID_WIDTH }}
          >
            {timeSlots.map((slot) => (
              <div 
                key={`header-${slot}`}
                className="bg-gray-100 border-r border-gray-300 p-2 text-center flex items-center justify-center"
                style={{ width: SLOT_WIDTH, minWidth: SLOT_WIDTH }}
              >
                <span className="text-xs font-medium text-gray-700">{slot}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Fixed table labels column */}
        <div 
          className="bg-white overflow-y-auto"
          style={{ width: TABLE_LABEL_WIDTH, minWidth: TABLE_LABEL_WIDTH }}
        >
          {tablesBySection.map((section) => (
            <div key={section.id}>
              {/* Section Header */}
              <div className="bg-gray-100 border-b border-gray-200 py-2 px-3" style={{ height: '36px' }}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: section.color }}
                  />
                  <span className="text-sm font-semibold text-gray-800">{section.name}</span>
                  <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">
                    {section.tables.length}
                  </Badge>
                </div>
              </div>

              {/* Table rows */}
              {section.tables.map((table) => (
                <div 
                  key={table.id} 
                  className="border-b border-gray-200 p-2 bg-white hover:bg-gray-50 transition-colors flex items-center"
                  style={{ height: '36px' }}
                >
                  <span className="text-sm font-semibold text-gray-900">{table.label}</span>
                  <span className="text-xs text-gray-600 ml-1">({table.seats})</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Scrollable time grid */}
        <div 
          className="flex-1 overflow-x-auto overflow-y-auto"
          onScroll={(e) => {
            // Sync scroll with header
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
                  className="bg-gray-100 border-b border-gray-200 flex"
                  style={{ height: '36px' }}
                >
                  {timeSlots.map((slot) => (
                    <div 
                      key={`section-${section.id}-${slot}`}
                      className="border-r border-gray-200"
                      style={{ width: SLOT_WIDTH, minWidth: SLOT_WIDTH }}
                    />
                  ))}
                </div>

                {/* Table rows */}
                {section.tables.map((table) => (
                  <div 
                    key={table.id} 
                    className="relative flex border-b border-gray-200"
                    style={{ height: '36px' }}
                  >
                    {/* Time slot cells */}
                    {timeSlots.map((slot, slotIndex) => {
                      // Check if any booking covers this slot
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
                        <div
                          key={`${table.id}-${slot}`}
                          className="border-r border-gray-200 hover:bg-blue-50 cursor-pointer flex items-center justify-center relative"
                          style={{ width: SLOT_WIDTH, minWidth: SLOT_WIDTH }}
                          onClick={() => {
                            if (!hasBooking) {
                              onWalkInClick(table.id, slot);
                            }
                          }}
                        >
                          {!hasBooking && (
                            <div className="opacity-0 hover:opacity-100 transition-opacity">
                              <span className="text-xs text-gray-400">+</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Block overlay for this table */}
                    <BlockOverlay 
                      selectedDate={selectedDate}
                      venueHours={venueHours}
                      tableId={table.id}
                    />

                    {/* Bookings for this table - absolutely positioned */}
                    {activeBookings
                      .filter(booking => booking.table_id === table.id)
                      .map((booking) => {
                        const position = getBookingPosition(booking);
                        if (!position) return null;
                        
                        return (
                          <div
                            key={booking.id}
                            className={`absolute rounded text-xs p-1 cursor-pointer transition-all shadow-sm border ${getBookingStatusColor(booking.status)} z-10`}
                            style={{
                              left: `${position.left}px`,
                              width: `${position.width}px`,
                              top: '2px',
                              height: '32px'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onBookingClick(booking);
                            }}
                          >
                            <div className="flex flex-col justify-center h-full">
                              <div className="font-medium truncate text-xs flex items-center gap-1">
                                {booking.guest_name} ({booking.party_size})
                                {booking.deposit_per_guest > 0 && (
                                  <DollarSign className="h-3 w-3" />
                                )}
                              </div>
                              {booking.service && (
                                <div className="text-xs opacity-90 truncate">{booking.service}</div>
                              )}
                            </div>
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
  );
};
