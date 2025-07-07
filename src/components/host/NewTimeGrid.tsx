
import React, { useState, useEffect, useRef } from 'react';
import { format, addMinutes } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Table {
  id: number;
  label: string;
  seats: number;
  section_id: number | null;
  status: 'active' | 'deleted';
}

interface Section {
  id: number;
  name: string;
  color: string;
}

interface Booking {
  id: number;
  table_id: number | null;
  guest_name: string;
  party_size: number;
  booking_time: string;
  duration_minutes: number;
  status: 'confirmed' | 'seated' | 'finished' | 'cancelled' | 'late';
  service: string;
}

interface NewTimeGridProps {
  venueHours: { start_time: string; end_time: string } | null;
  tables: Table[];
  sections: Section[];
  bookings: Booking[];
  onWalkInClick: (tableId: number, time: string) => void;
  onBookingClick: (booking: Booking) => void;
  onBookingDrag: (bookingId: number, newTime: string, newTableId: number) => void;
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
}: NewTimeGridProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draggedBooking, setDraggedBooking] = useState<Booking | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const generateTimeSlots = () => {
    if (!venueHours) return [];
    
    const [startHour, startMin] = venueHours.start_time.split(':').map(Number);
    const [endHour, endMin] = venueHours.end_time.split(':').map(Number);
    
    const slots = [];
    let current = new Date();
    current.setHours(startHour, startMin, 0, 0);
    
    const end = new Date();
    end.setHours(endHour, endMin, 0, 0);
    
    while (current <= end) {
      slots.push(format(current, 'HH:mm'));
      current = addMinutes(current, 15);
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const currentTimeStr = format(currentTime, 'HH:mm');

  const calculateBookingPosition = (booking: Booking) => {
    if (!venueHours) return { left: 0, width: 0 };
    
    const [venueStartHour, venueStartMin] = venueHours.start_time.split(':').map(Number);
    const [bookingHour, bookingMin] = booking.booking_time.split(':').map(Number);
    
    const venueStartMinutes = venueStartHour * 60 + venueStartMin;
    const bookingStartMinutes = bookingHour * 60 + bookingMin;
    const offsetMinutes = bookingStartMinutes - venueStartMinutes;
    
    const left = (offsetMinutes / 15) * 60; // 60px per 15-minute slot
    const width = (booking.duration_minutes / 15) * 60;
    
    return { left, width };
  };

  const getCurrentTimePosition = () => {
    if (!venueHours) return -1;
    
    const [venueStartHour, venueStartMin] = venueHours.start_time.split(':').map(Number);
    const currentHour = currentTime.getHours();
    const currentMin = currentTime.getMinutes();
    
    const venueStartMinutes = venueStartHour * 60 + venueStartMin;
    const currentMinutes = currentHour * 60 + currentMin;
    const offsetMinutes = currentMinutes - venueStartMinutes;
    
    return (offsetMinutes / 15) * 60;
  };

  const handleTimeSlotClick = (time: string, tableId: number, event: React.MouseEvent) => {
    if (!draggedBooking && event.detail === 1) { // Single click only
      onWalkInClick(tableId, time);
    }
  };

  const handleBookingMouseDown = (booking: Booking, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDraggedBooking(booking);
    setDragPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (draggedBooking) {
      setDragPosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseUp = (event: React.MouseEvent) => {
    if (draggedBooking) {
      const element = document.elementFromPoint(event.clientX, event.clientY);
      const timeSlot = element?.getAttribute('data-time');
      const tableId = element?.getAttribute('data-table-id');
      
      if (timeSlot && tableId) {
        onBookingDrag(draggedBooking.id, timeSlot, parseInt(tableId));
      }
      
      setDraggedBooking(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'seated': return 'bg-blue-500';
      case 'finished': return 'bg-gray-400';
      case 'cancelled': return 'bg-red-500';
      case 'late': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const currentTimePosition = getCurrentTimePosition();
  const totalWidth = timeSlots.length * 60;

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border overflow-hidden">
      {/* Time Header */}
      <div className="flex border-b bg-gray-50 sticky top-0 z-20">
        <div className="w-48 p-3 border-r bg-gray-100 flex-shrink-0">
          <span className="font-semibold text-sm">Tables</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex" style={{ minWidth: `${totalWidth}px` }}>
            {timeSlots.map((time, index) => (
              <div
                key={time}
                className="w-[60px] p-2 text-xs font-medium text-center border-r border-gray-200 last:border-r-0 relative"
              >
                {time}
                {/* Current time indicator in header */}
                {currentTimeStr >= time && 
                 currentTimeStr < (timeSlots[index + 1] || '23:59') && 
                 currentTimePosition >= 0 && (
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                    style={{ 
                      left: `${((currentTime.getMinutes() % 15) / 15) * 60}px` 
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
        {/* Fixed Table List */}
        <div className="w-48 flex-shrink-0 border-r bg-white overflow-y-auto">
          {sections.map((section) => {
            const sectionTables = tables.filter(table => 
              table.section_id === section.id && table.status === 'active'
            );
            
            if (sectionTables.length === 0) return null;

            return (
              <div key={section.id}>
                {/* Section Header */}
                <div 
                  className="px-3 py-2 bg-gray-50 border-b text-sm font-semibold"
                  style={{ borderLeftColor: section.color, borderLeftWidth: '3px' }}
                >
                  {section.name} ({sectionTables.length})
                </div>
                
                {/* Tables */}
                {sectionTables.map((table) => (
                  <div
                    key={table.id}
                    className="h-12 px-3 border-b border-gray-100 flex items-center hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-sm">{table.label}</span>
                      <span className="text-xs text-gray-500 px-1 py-0 border border-gray-300 rounded">
                        {table.seats}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Scrollable Timeline */}
        <div className="flex-1 relative overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div 
              className="relative"
              style={{ minWidth: `${totalWidth}px`, height: `${tables.filter(t => t.status === 'active').length * 48}px` }}
            >
              {/* Time Grid Background */}
              {sections.map((section) => {
                const sectionTables = tables.filter(table => 
                  table.section_id === section.id && table.status === 'active'
                );
                
                return sectionTables.map((table, tableIndex) => {
                  const rowTop = sections.slice(0, sections.indexOf(section)).reduce((acc, s) => 
                    acc + tables.filter(t => t.section_id === s.id && t.status === 'active').length, 0
                  ) * 48 + tableIndex * 48;

                  return (
                    <div key={table.id}>
                      {/* Clickable Time Slots */}
                      {timeSlots.map((time) => (
                        <div
                          key={`${table.id}-${time}`}
                          className="absolute h-12 w-[60px] border-r border-gray-100 hover:bg-blue-50 cursor-pointer"
                          style={{
                            top: `${rowTop}px`,
                            left: `${timeSlots.indexOf(time) * 60}px`
                          }}
                          data-time={time}
                          data-table-id={table.id}
                          onClick={(e) => handleTimeSlotClick(time, table.id, e)}
                        />
                      ))}
                      
                      {/* Table Row Border */}
                      <div
                        className="absolute w-full h-px bg-gray-100"
                        style={{ top: `${rowTop + 48}px` }}
                      />
                    </div>
                  );
                });
              })}

              {/* Bookings */}
              {bookings.map((booking) => {
                if (!booking.table_id) return null;
                
                const table = tables.find(t => t.id === booking.table_id);
                if (!table) return null;
                
                const section = sections.find(s => s.id === table.section_id);
                if (!section) return null;
                
                const sectionIndex = sections.indexOf(section);
                const tableIndex = tables.filter(t => 
                  t.section_id === section.id && t.status === 'active'
                ).indexOf(table);
                
                const rowTop = sections.slice(0, sectionIndex).reduce((acc, s) => 
                  acc + tables.filter(t => t.section_id === s.id && t.status === 'active').length, 0
                ) * 48 + tableIndex * 48;

                const { left, width } = calculateBookingPosition(booking);

                return (
                  <div
                    key={booking.id}
                    className={`absolute h-10 rounded-md text-white text-xs flex items-center px-2 cursor-pointer shadow-sm z-10 ${getStatusColor(booking.status)} hover:shadow-md transition-shadow`}
                    style={{
                      top: `${rowTop + 1}px`,
                      left: `${left}px`,
                      width: `${Math.max(width, 80)}px`
                    }}
                    onClick={() => onBookingClick(booking)}
                    onMouseDown={(e) => handleBookingMouseDown(booking, e)}
                  >
                    <div className="flex items-center justify-between w-full overflow-hidden">
                      <span className="font-medium truncate">{booking.guest_name}</span>
                      <span className="ml-1 text-xs bg-white/20 px-1 rounded">
                        {booking.party_size}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Current Time Line */}
              {currentTimePosition >= 0 && format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
                  style={{ left: `${currentTimePosition}px` }}
                >
                  <div className="absolute -top-6 -left-6 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {currentTimeStr}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Dragged Booking Preview */}
      {draggedBooking && (
        <div
          className="fixed pointer-events-none z-50 h-10 rounded-md text-white text-xs flex items-center px-2 shadow-lg opacity-80"
          style={{
            top: `${dragPosition.y - 20}px`,
            left: `${dragPosition.x - 40}px`,
            width: '80px'
          }}
        >
          <div className={`w-full h-full rounded-md flex items-center justify-center ${getStatusColor(draggedBooking.status)}`}>
            <span className="font-medium truncate">{draggedBooking.guest_name}</span>
          </div>
        </div>
      )}
    </div>
  );
};
