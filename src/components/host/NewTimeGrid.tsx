
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { DragDropProvider } from './DragDropProvider';
import { DroppableTimeSlot } from './DroppableTimeSlot';
import { DraggableBooking } from './DraggableBooking';

interface NewTimeGridProps {
  venueHours: any;
  tables: any[];
  sections: any[];
  bookings: any[];
  onWalkInClick: (tableId: number, time: string) => void;
  onBookingClick: (booking: any) => void;
  onBookingDrag: (bookingId: number, newTime: string, newTableId: number) => void;
  onBlockClick: (block: any) => void;
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
  selectedDate
}: NewTimeGridProps) => {
  if (!venueHours) {
    return (
      <Card className="p-4">
        <div className="text-center text-muted-foreground">
          Loading venue hours...
        </div>
      </Card>
    );
  }

  // Generate time slots (15-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    const [startHour, startMin] = venueHours.start_time.split(':').map(Number);
    const [endHour, endMin] = venueHours.end_time.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMin = startMin;
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      slots.push(`${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`);
      
      currentMin += 15;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const SLOT_WIDTH = 60;
  const ROW_HEIGHT = 60;

  // Group tables by section
  const tablesBySection: Record<number, any[]> = sections.reduce((acc: Record<number, any[]>, section: any) => {
    acc[section.id] = tables.filter(table => table.section_id === section.id);
    return acc;
  }, {} as Record<number, any[]>);

  // Add tables without sections
  const tablesWithoutSection = tables.filter(table => !table.section_id);
  if (tablesWithoutSection.length > 0) {
    tablesBySection[0] = tablesWithoutSection;
  }

  const getBookingsForTable = (tableId: number) => {
    return bookings.filter(booking => booking.table_id === tableId);
  };

  const getBookingStatusColor = (status: string) => {
    const colors = {
      'confirmed': 'bg-blue-500 text-white',
      'seated': 'bg-green-500 text-white',
      'finished': 'bg-gray-500 text-white',
      'late': 'bg-orange-500 text-white',
      'cancelled': 'bg-red-500 text-white'
    };
    return colors[status as keyof typeof colors] || 'bg-blue-500 text-white';
  };

  const calculateBookingPosition = (booking: any) => {
    const [startHour, startMin] = venueHours.start_time.split(':').map(Number);
    const [bookingHour, bookingMin] = booking.booking_time.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const bookingMinutes = bookingHour * 60 + bookingMin;
    const offsetMinutes = bookingMinutes - startMinutes;
    
    const slotIndex = Math.floor(offsetMinutes / 15);
    const left = slotIndex * SLOT_WIDTH;
    
    const duration = booking.duration_minutes || 120;
    const slotsNeeded = Math.ceil(duration / 15);
    const width = slotsNeeded * SLOT_WIDTH;
    
    return { left: Math.max(0, left), width: Math.max(SLOT_WIDTH, width) };
  };

  return (
    <DragDropProvider onBookingDrag={onBookingDrag}>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Header with time slots */}
            <div className={`grid grid-cols-${timeSlots.length + 1} gap-0 border-b bg-muted/30`}>
              <div className="p-2 border-r bg-background font-medium text-xs">
                Tables
              </div>
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="p-1 border-r text-center bg-background"
                  style={{ width: `${SLOT_WIDTH}px` }}
                >
                  <div className="text-xs font-medium">{time}</div>
                </div>
              ))}
            </div>

            {/* Table rows by section */}
            {Object.entries(tablesBySection).map(([sectionId, sectionTables]) => {
              const section = sections.find(s => s.id === parseInt(sectionId)) || { name: 'No Section', color: '#666' };
              
              return (
                <div key={sectionId}>
                  {/* Section header */}
                  {section.name !== 'No Section' && (
                    <div className={`grid grid-cols-${timeSlots.length + 1} gap-0 bg-muted/20 border-b`}>
                      <div className="p-1 border-r">
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ borderColor: section.color, color: section.color }}
                        >
                          {section.name}
                        </Badge>
                      </div>
                      {timeSlots.map((time) => (
                        <div key={time} className="border-r" style={{ width: `${SLOT_WIDTH}px` }}></div>
                      ))}
                    </div>
                  )}
                  
                  {/* Table rows */}
                  {sectionTables.map((table) => {
                    const tableBookings = getBookingsForTable(table.id);
                    
                    return (
                      <div key={table.id} className={`grid grid-cols-${timeSlots.length + 1} gap-0 border-b hover:bg-muted/30 relative`}>
                        {/* Table info */}
                        <div className="p-2 border-r bg-background/50 flex flex-col justify-center">
                          <div className="font-medium text-sm">{table.label}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {table.seats}
                          </div>
                        </div>
                        
                        {/* Time slots */}
                        {timeSlots.map((time, slotIndex) => {
                          const hasBooking = tableBookings.some(booking => {
                            const position = calculateBookingPosition(booking);
                            const bookingSlotIndex = Math.floor(position.left / SLOT_WIDTH);
                            const bookingSlotSpan = Math.ceil(position.width / SLOT_WIDTH);
                            return slotIndex >= bookingSlotIndex && slotIndex < bookingSlotIndex + bookingSlotSpan;
                          });

                          return (
                            <DroppableTimeSlot
                              key={time}
                              tableId={table.id}
                              timeSlot={time}
                              slotIndex={slotIndex}
                              hasBooking={hasBooking}
                              onWalkInClick={onWalkInClick}
                              SLOT_WIDTH={SLOT_WIDTH}
                              rowHeight={ROW_HEIGHT}
                            />
                          );
                        })}
                        
                        {/* Booking bars */}
                        {tableBookings.map((booking, index) => {
                          const position = calculateBookingPosition(booking);
                          
                          return (
                            <DraggableBooking
                              key={booking.id}
                              booking={booking}
                              index={index}
                              position={position}
                              onBookingClick={onBookingClick}
                              getBookingStatusColor={getBookingStatusColor}
                              rowHeight={ROW_HEIGHT}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </DragDropProvider>
  );
};
