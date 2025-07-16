import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Phone } from 'lucide-react';
import { mockBookings, mockTables } from '@/data/mockData';

export const HostScreenMockup = () => {
  const timeSlots = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'];
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-grace-primary text-white';
      case 'seated': return 'bg-green-500 text-white';
      case 'finished': return 'bg-blue-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getTableStatus = (tableId: number) => {
    const booking = mockBookings.find(b => b.table_id === tableId);
    if (!booking) return 'available';
    return booking.status;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Host Screen - Tonight's Service
        </CardTitle>
        <CardDescription>
          Real-time table management and booking overview
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Grid Header */}
        <div className="grid grid-cols-7 gap-2 text-sm">
          <div className="font-medium text-muted-foreground">Tables</div>
          {timeSlots.map(time => (
            <div key={time} className="text-center font-medium text-muted-foreground">
              {time}
            </div>
          ))}
        </div>
        
        {/* Table Rows */}
        <div className="space-y-1">
          {mockTables.slice(0, 6).map(table => (
            <div key={table.id} className="grid grid-cols-7 gap-2 items-center py-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium ${
                  getTableStatus(table.id) === 'available' 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                }`}>
                  {table.label}
                </div>
                <div className="text-sm text-muted-foreground">
                  <Users className="h-3 w-3 inline mr-1" />
                  {table.seats}
                </div>
              </div>
              
              {timeSlots.map(time => {
                const booking = mockBookings.find(b => 
                  b.table_id === table.id && b.booking_time === time
                );
                
                return (
                  <div key={time} className="text-center">
                    {booking ? (
                      <div className="relative">
                        <div className={`text-xs px-2 py-1 rounded text-white ${getStatusColor(booking.status)}`}>
                          {booking.guest_name.split(' ')[0]}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
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
          ))}
        </div>
        
        {/* Current Bookings Summary */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-grace-primary">
                {mockBookings.filter(b => b.status === 'confirmed').length}
              </div>
              <div className="text-sm text-muted-foreground">Confirmed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {mockBookings.filter(b => b.status === 'seated').length}
              </div>
              <div className="text-sm text-muted-foreground">Seated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {mockBookings.filter(b => b.status === 'finished').length}
              </div>
              <div className="text-sm text-muted-foreground">Finished</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};