
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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

  const getBookingForTimeSlot = (tableId: number, timeSlot: string) => {
    return bookings.find(booking => 
      booking.table_id === tableId && 
      booking.booking_time.substring(0, 5) === timeSlot &&
      booking.status !== 'cancelled'
    );
  };

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
  const getBookingStyle = (booking: any, startTime: string) => {
    const bookingTime = booking.booking_time.substring(0, 5);
    const duration = booking.duration_minutes || 120;
    
    // Find the index of the booking start time
    const startIndex = timeSlots.findIndex(slot => slot === bookingTime);
    if (startIndex === -1) return null;
    
    // Calculate how many 15-minute slots this booking spans
    const slotsSpanned = Math.ceil(duration / 15);
    
    // Calculate position and width
    const left = startIndex * SLOT_WIDTH;
    const width = slotsSpanned * SLOT_WIDTH - 2; // -2 for border spacing
    
    return {
      position: 'absolute' as const,
      left: `${left}px`,
      width: `${width}px`,
      top: '2px',
      bottom: '2px',
      zIndex: 10
    };
  };

  const SLOT_WIDTH = 60; // Reduced width for 15-minute slots
  const TABLE_LABEL_WIDTH = 100; // Slightly wider for table labels

  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-lg overflow-hidden">
      {/* Fixed Header with time slots */}
      <div className="flex border-b border-gray-600 bg-gray-700 sticky top-0 z-20">
        <div style={{ width: TABLE_LABEL_WIDTH }} className="flex-shrink-0 border-r border-gray-600 p-2">
          <span className="text-xs font-medium text-gray-300">Tables</span>
        </div>
        <div className="flex overflow-x-auto">
          {timeSlots.map((slot) => (
            <div key={slot} style={{ width: SLOT_WIDTH }} className="flex-shrink-0 p-1 text-center border-r border-gray-600">
              <span className="text-xs font-medium text-gray-300">{slot}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content area with fixed positioning */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="min-w-full">
          {tablesBySection.map((section) => (
            <div key={section.id}>
              {/* Section Header - Full Width Spanning */}
              <div className="flex bg-gray-700 border-b border-gray-600 sticky top-0 z-15">
                <div 
                  className="flex items-center justify-center py-2 border-r border-gray-600"
                  style={{ 
                    width: `calc(${TABLE_LABEL_WIDTH}px + ${timeSlots.length * SLOT_WIDTH}px)` 
                  }}
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
              </div>

              {/* Tables in this section */}
              {section.tables.map((table) => (
                <div key={table.id} className="flex border-b border-gray-600 hover:bg-gray-750 relative min-h-[60px]">
                  {/* Table label - Fixed width */}
                  <div 
                    style={{ width: TABLE_LABEL_WIDTH }} 
                    className="flex-shrink-0 border-r border-gray-600 p-3 flex items-center justify-center bg-gray-800 z-10"
                  >
                    <div className="text-center">
                      <div className="text-sm font-medium text-white">{table.label}</div>
                      <div className="text-xs text-gray-400">{table.seats} seats</div>
                    </div>
                  </div>

                  {/* Time grid container - Fixed positioning for bookings */}
                  <div className="flex-1 relative" style={{ minWidth: timeSlots.length * SLOT_WIDTH }}>
                    {/* Time slot grid - for click handling */}
                    <div className="flex absolute inset-0">
                      {timeSlots.map((slot) => (
                        <div
                          key={`${table.id}-${slot}`}
                          style={{ width: SLOT_WIDTH }}
                          className="flex-shrink-0 border-r border-gray-600 min-h-[60px] cursor-pointer hover:bg-gray-700 relative"
                          onClick={() => {
                            // Only allow click if no booking covers this slot
                            const hasBooking = bookings.some(booking => {
                              if (booking.table_id !== table.id) return false;
                              const bookingStart = booking.booking_time.substring(0, 5);
                              const duration = booking.duration_minutes || 120;
                              const bookingStartIndex = timeSlots.findIndex(s => s === bookingStart);
                              const currentSlotIndex = timeSlots.findIndex(s => s === slot);
                              const slotsSpanned = Math.ceil(duration / 15);
                              
                              return currentSlotIndex >= bookingStartIndex && 
                                     currentSlotIndex < bookingStartIndex + slotsSpanned;
                            });
                            
                            if (!hasBooking) {
                              onWalkInClick(table.id, slot);
                            }
                          }}
                        >
                          <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-xs text-gray-400">+</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bookings - Absolutely positioned */}
                    {bookings
                      .filter(booking => booking.table_id === table.id)
                      .map((booking) => {
                        const style = getBookingStyle(booking, booking.booking_time);
                        if (!style) return null;
                        
                        return (
                          <div
                            key={booking.id}
                            style={style}
                            className={`rounded text-xs p-2 cursor-pointer transition-colors ${getBookingStatusColor(booking.status)} shadow-md border border-gray-600`}
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
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
