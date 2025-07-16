import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Link } from 'lucide-react';
import { mockHostBookings, mockEnhancedTables, mockSections } from '@/data/mockData';

export const HostScreenMockup = () => {
  // Generate 15-minute intervals like real OptimizedTimeGrid
  const timeSlots = ['18:00', '18:15', '18:30', '18:45', '19:00', '19:15', '19:30', '19:45', '20:00', '20:15', '20:30', '20:45'];
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-primary text-primary-foreground';
      case 'seated': return 'bg-green-500 text-white';
      case 'finished': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getBookingForTable = (tableId: number, time: string) => {
    return mockHostBookings.find(b => b.table_id === tableId && b.booking_time === time);
  };

  const getSectionTables = (sectionId: number) => {
    return mockEnhancedTables.filter(table => table.section_id === sectionId);
  };

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Host Screen - Tonight's Service
        </CardTitle>
        <CardDescription>
          Real-time table management and booking synchronisation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-0">
        {/* Time Grid in OptimizedTimeGrid style */}
        <div className="relative bg-background rounded-lg border">
          {/* Time Headers */}
          <div className="sticky top-0 z-20 bg-muted/50 border-b">
            <div className="flex">
              <div className="w-36 p-2 font-semibold text-center border-r bg-muted flex-shrink-0">
                Tables
              </div>
              <div className="flex-1 overflow-x-auto">
                <div className="flex" style={{ minWidth: `${timeSlots.length * 56}px` }}>
                  {timeSlots.map((time) => (
                    <div key={time} className="w-[56px] p-2 text-xs font-medium text-center border-r last:border-r-0 bg-muted/50 flex-shrink-0">
                      {time}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="relative">
            {mockSections.map((section) => {
              const sectionTables = getSectionTables(section.id);
              
              if (sectionTables.length === 0) return null;

              return (
                <div key={section.id}>
                  {/* Section Header */}
                  <div 
                    className="bg-muted/30 px-3 py-2 border-b flex items-center"
                    style={{ borderLeftColor: section.color, borderLeftWidth: '3px' }}
                  >
                    <div className="w-36 flex-shrink-0">
                      <h3 className="font-semibold text-sm" style={{ color: section.color }}>
                        {section.name} ({sectionTables.length})
                      </h3>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                      <div style={{ minWidth: `${timeSlots.length * 56}px` }}></div>
                    </div>
                  </div>

                  {/* Table Rows */}
                  {sectionTables.map((table) => (
                    <div key={table.id} className="flex border-b min-h-[40px]">
                      {/* Fixed Table Name Column */}
                      <div className="w-36 p-2 border-r flex items-center bg-background flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{table.label}</span>
                          <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                            {table.seats}
                          </Badge>
                          {table.join_groups && table.join_groups.length > 0 && (
                            <Link className="h-3 w-3 text-blue-600" />
                          )}
                          {!table.online_bookable && (
                            <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                              Offline
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Scrollable Content Area */}
                      <div className="flex-1 overflow-x-auto">
                        <div 
                          className="relative bg-background min-h-[40px] flex"
                          style={{ minWidth: `${timeSlots.length * 56}px` }}
                        >
                          {timeSlots.map((time) => {
                            const booking = getBookingForTable(table.id, time);
                            
                            return (
                              <div key={time} className="w-[56px] border-r flex items-center justify-center p-1">
                                {booking ? (
                                  <div className="w-full">
                                    <div className={`text-xs px-1 py-0.5 rounded text-center ${getStatusColor(booking.status)}`}>
                                      {booking.guest_name.split(' ')[0]}
                                    </div>
                                    <div className="text-xs text-muted-foreground text-center mt-0.5">
                                      {booking.party_size}p
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground">-</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Current Bookings Summary */}
        <div className="border-t pt-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {mockHostBookings.filter(b => b.status === 'confirmed').length}
              </div>
              <div className="text-sm text-muted-foreground">Confirmed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {mockHostBookings.filter(b => b.status === 'seated').length}
              </div>
              <div className="text-sm text-muted-foreground">Seated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {mockHostBookings.filter(b => b.status === 'finished').length}
              </div>
              <div className="text-sm text-muted-foreground">Finished</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};