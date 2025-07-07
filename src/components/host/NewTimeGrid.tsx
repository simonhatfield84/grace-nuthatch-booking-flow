
import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useSections } from "@/hooks/useSections";
import { format } from "date-fns";

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

  // Filter out cancelled bookings - they should not appear on the grid
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
      case 'confirmed': return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'seated': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'finished': return 'bg-gray-400 hover:bg-gray-500 text-white';
      case 'late': return 'bg-orange-500 hover:bg-orange-600 text-white';
      default: return 'bg-blue-500 hover:bg-blue-600 text-white';
    }
  };

  // Calculate booking position and width based on duration
  const getBookingStyle = (booking: any) => {
    const bookingTime = booking.booking_time.substring(0, 5);
    const duration = booking.duration_minutes || 120;
    
    // Find the index of the booking start time
    const startIndex = timeSlots.findIndex(slot => slot === bookingTime);
    if (startIndex === -1) return null;
    
    // Calculate how many 15-minute slots this booking spans
    const slotsSpanned = Math.ceil(duration / 15);
    
    // Calculate position and width using CSS Grid positioning
    return {
      gridColumnStart: startIndex + 2, // +2 because first column is table label
      gridColumnEnd: startIndex + 2 + slotsSpanned,
      gridRowStart: 1,
      gridRowEnd: 1,
      zIndex: 10
    };
  };

  const SLOT_WIDTH = 50; // Reduced width for 15-minute slots to fit more on screen
  const TABLE_LABEL_WIDTH = 120;

  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-lg overflow-hidden">
      {/* Unified scrolling container - this is the key fix */}
      <ScrollArea className="flex-1">
        <div 
          className="grid"
          style={{
            gridTemplateColumns: `${TABLE_LABEL_WIDTH}px repeat(${timeSlots.length}, ${SLOT_WIDTH}px)`,
            minWidth: TABLE_LABEL_WIDTH + (timeSlots.length * SLOT_WIDTH)
          }}
        >
          {/* Time header row - moves with content during scroll */}
          <div className="sticky top-0 z-20 bg-gray-700 border-b border-gray-600 p-2 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-300">Tables</span>
          </div>
          
          {timeSlots.map((slot) => (
            <div 
              key={`header-${slot}`}
              className="sticky top-0 z-20 bg-gray-700 border-b border-gray-600 border-r border-gray-600 p-1 text-center"
            >
              <span className="text-xs font-medium text-gray-300">{slot}</span>
            </div>
          ))}

          {/* Content rows */}
          {tablesBySection.map((section) => (
            <div key={section.id} className="contents">
              {/* Section Header Row */}
              <div 
                className="bg-gray-700 border-b border-gray-600 py-2 flex items-center justify-center"
                style={{ gridColumn: `1 / ${timeSlots.length + 2}` }}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: section.color }}
                  />
                  <span className="text-sm font-semibold text-white">{section.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {section.tables.length} tables
                  </Badge>
                </div>
              </div>

              {/* Table rows */}
              {section.tables.map((table) => (
                <div key={table.id} className="contents">
                  {/* Table label */}
                  <div className="bg-gray-800 border-r border-gray-600 border-b border-gray-600 p-3 flex items-center justify-center min-h-[60px]">
                    <div className="text-center">
                      <div className="text-sm font-medium text-white">{table.label}</div>
                      <div className="text-xs text-gray-400">{table.seats} seats</div>
                    </div>
                  </div>

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
                        className="border-r border-gray-600 border-b border-gray-600 min-h-[60px] cursor-pointer hover:bg-gray-700 relative flex items-center justify-center"
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

                  {/* Bookings for this table - positioned using CSS Grid */}
                  {activeBookings
                    .filter(booking => booking.table_id === table.id)
                    .map((booking) => {
                      const style = getBookingStyle(booking);
                      if (!style) return null;
                      
                      return (
                        <div
                          key={booking.id}
                          className={`rounded text-xs p-2 cursor-pointer transition-colors ${getBookingStatusColor(booking.status)} shadow-md border border-gray-600 m-1 flex flex-col justify-center`}
                          style={style}
                          onClick={(e) => {
                            e.stopPropagation();
                            onBookingClick(booking);
                          }}
                        >
                          <div className="font-medium truncate text-white">{booking.guest_name}</div>
                          <div className="text-xs opacity-90 text-white">{booking.party_size} pax</div>
                          <div className="text-xs opacity-75 capitalize text-white">{booking.status}</div>
                          <div className="text-xs opacity-60 text-white">{booking.duration_minutes || 120}min</div>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
