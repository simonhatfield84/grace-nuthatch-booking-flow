
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

  // Generate time slots
  useEffect(() => {
    const slots: string[] = [];
    const startHour = 12; // 12:00 PM
    const endHour = 23; // 11:00 PM
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
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

  console.log('🔍 TimeGrid Debug:', {
    selectedDate: format(selectedDate, 'yyyy-MM-dd'),
    bookingsReceived: bookings.length,
    tablesCount: tables.length,
    sectionsCount: sections.length,
    tablesWithPositions: tables.map(t => ({
      id: t.id,
      label: t.label,
      rowIndex: tables.findIndex(table => table.id === t.id)
    }))
  });

  const getBookingForTimeSlot = (tableId: number, timeSlot: string) => {
    return bookings.find(booking => 
      booking.table_id === tableId && 
      booking.booking_time.substring(0, 5) === timeSlot &&
      booking.status !== 'cancelled'
    );
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-500 hover:bg-blue-600';
      case 'seated': return 'bg-green-500 hover:bg-green-600';
      case 'finished': return 'bg-gray-400 hover:bg-gray-500';
      case 'late': return 'bg-orange-500 hover:bg-orange-600';
      default: return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  const SLOT_WIDTH = 120; // Width of each time slot
  const TABLE_LABEL_WIDTH = 80; // Width of table label column

  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-lg overflow-hidden">
      {/* Header with time slots */}
      <div className="flex border-b border-gray-600 bg-gray-700">
        <div style={{ width: TABLE_LABEL_WIDTH }} className="flex-shrink-0 border-r border-gray-600 p-2">
          <span className="text-xs font-medium text-gray-300">Tables</span>
        </div>
        <div className="flex overflow-x-auto">
          {timeSlots.map((slot) => (
            <div key={slot} style={{ width: SLOT_WIDTH }} className="flex-shrink-0 p-2 text-center border-r border-gray-600">
              <span className="text-xs font-medium text-gray-300">{slot}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content area */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="min-w-full">
          {tablesBySection.map((section) => (
            <div key={section.id}>
              {/* Section Header - Full Width */}
              <div className="flex bg-gray-700 border-b border-gray-600 sticky top-0 z-10">
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
                <div key={table.id} className="flex border-b border-gray-600 hover:bg-gray-750">
                  {/* Table label */}
                  <div 
                    style={{ width: TABLE_LABEL_WIDTH }} 
                    className="flex-shrink-0 border-r border-gray-600 p-3 flex items-center justify-center bg-gray-800"
                  >
                    <div className="text-center">
                      <div className="text-sm font-medium text-white">{table.label}</div>
                      <div className="text-xs text-gray-400">{table.seats} seats</div>
                    </div>
                  </div>

                  {/* Time slots for this table */}
                  <div className="flex">
                    {timeSlots.map((slot) => {
                      const booking = getBookingForTimeSlot(table.id, slot);
                      return (
                        <div
                          key={`${table.id}-${slot}`}
                          style={{ width: SLOT_WIDTH }}
                          className="flex-shrink-0 border-r border-gray-600 p-1 min-h-[60px] relative cursor-pointer hover:bg-gray-700"
                          onClick={() => !booking && onWalkInClick(table.id, slot)}
                        >
                          {booking ? (
                            <div
                              className={`w-full h-full rounded text-white text-xs p-1 cursor-pointer transition-colors ${getBookingStatusColor(booking.status)}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onBookingClick(booking);
                              }}
                            >
                              <div className="font-medium truncate">{booking.guest_name}</div>
                              <div className="text-xs opacity-90">{booking.party_size} pax</div>
                              {booking.status && (
                                <div className="text-xs opacity-75 capitalize">{booking.status}</div>
                              )}
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <span className="text-xs text-gray-400">+</span>
                            </div>
                          )}
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
