
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { FloatingBookingBar } from './FloatingBookingBar';

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

  // Group tables by section - properly typed
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

  const handleCellClick = (tableId: number, time: string, event: React.MouseEvent) => {
    // Check if click is on a booking
    const target = event.target as HTMLElement;
    if (target.closest('[data-booking]')) {
      return; // Don't create walk-in if clicking on booking
    }
    
    onWalkInClick(tableId, time);
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Time header - more compact */}
          <div className="flex border-b bg-muted/30">
            <div className="w-24 p-2 border-r bg-background font-medium text-xs flex-shrink-0">
              Tables
            </div>
            <div className="flex flex-1">
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="min-w-[48px] flex-1 p-1 border-r text-center bg-background"
                >
                  <div className="text-xs font-medium">{time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Table rows by section */}
          {Object.entries(tablesBySection).map(([sectionId, sectionTables]) => {
            const section = sections.find(s => s.id === parseInt(sectionId)) || { name: 'No Section', color: '#666' };
            
            return (
              <div key={sectionId}>
                {/* Section header - more compact */}
                {section.name !== 'No Section' && (
                  <div className="flex bg-muted/20 border-b">
                    <div className="w-24 p-1 border-r flex-shrink-0">
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: section.color, color: section.color }}
                      >
                        {section.name}
                      </Badge>
                    </div>
                    <div className="flex-1"></div>
                  </div>
                )}
                
                {/* Table rows - reduced height */}
                {sectionTables.map((table) => {
                  const tableBookings = getBookingsForTable(table.id);
                  
                  return (
                    <div key={table.id} className="flex border-b hover:bg-muted/30 relative">
                      {/* Table info - more compact */}
                      <div className="w-24 p-2 border-r bg-background/50 flex flex-col justify-center flex-shrink-0">
                        <div className="font-medium text-sm">{table.label}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {table.seats}
                        </div>
                      </div>
                      
                      {/* Time slots container - this is the key fix */}
                      <div className="flex-1 relative" style={{ height: '56px' }}>
                        {/* Time slot grid */}
                        <div className="flex h-full absolute inset-0">
                          {timeSlots.map((time) => (
                            <div
                              key={time}
                              className="min-w-[48px] flex-1 border-r hover:bg-accent/20 cursor-pointer flex items-center justify-center"
                              onClick={(e) => handleCellClick(table.id, time, e)}
                            >
                              {/* Time slot content */}
                            </div>
                          ))}
                        </div>
                        
                        {/* Floating booking bars - positioned relative to this container */}
                        {tableBookings.map((booking) => (
                          <FloatingBookingBar
                            key={booking.id}
                            booking={booking}
                            startTime={venueHours.start_time}
                            timeSlots={timeSlots}
                            slotWidth={48}
                            onBookingClick={onBookingClick}
                            onBookingDrag={onBookingDrag}
                            compact={true}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
