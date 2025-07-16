import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TableShape } from '@/components/tables/TableShape';
import { Layout, Users, Settings } from 'lucide-react';
import { mockTables, mockSections, mockBookings } from '@/data/mockData';

export const TablesMockup = () => {
  const getTableBookingStatus = (tableId: number) => {
    const booking = mockBookings.find(b => b.table_id === tableId);
    return booking ? true : false;
  };

  const getSectionTables = (sectionId: number) => {
    return mockTables.filter(table => table.section_id === sectionId);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layout className="h-5 w-5" />
          Table Management - Floor Plan
        </CardTitle>
        <CardDescription>
          Visual table layout and availability management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section Overview */}
        <div className="grid grid-cols-3 gap-4">
          {mockSections.map(section => (
            <div key={section.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: section.color }}
                  />
                  <span className="font-medium">{section.name}</span>
                </div>
                <Badge variant="outline">
                  {getSectionTables(section.id).length} tables
                </Badge>
              </div>
              
              {/* Tables in this section */}
              <div className="flex flex-wrap gap-2">
                {getSectionTables(section.id).map(table => (
                  <TableShape
                    key={table.id}
                    table={table}
                    isBooking={getTableBookingStatus(table.id)}
                    size="sm"
                  />
                ))}
              </div>
              
              <div className="text-sm text-muted-foreground">
                {section.description}
              </div>
            </div>
          ))}
        </div>
        
        {/* Table Statistics */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-grace-primary">
                {mockTables.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Tables</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {mockTables.filter(t => !getTableBookingStatus(t.id)).length}
              </div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {mockTables.filter(t => getTableBookingStatus(t.id)).length}
              </div>
              <div className="text-sm text-muted-foreground">Reserved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {mockTables.reduce((sum, t) => sum + t.seats, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Seats</div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500"></div>
            <span>Reserved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-400"></div>
            <span>Offline</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};