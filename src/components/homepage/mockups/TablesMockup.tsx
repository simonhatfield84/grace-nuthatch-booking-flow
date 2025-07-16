import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layout, Users, Check, X, Link, Edit, Trash2 } from 'lucide-react';
import { mockEnhancedTables, mockSections, mockHostBookings } from '@/data/mockData';

export const TablesMockup = () => {
  const getTableBookingStatus = (tableId: number) => {
    const booking = mockHostBookings.find(b => b.table_id === tableId);
    return booking ? true : false;
  };

  const getSectionTables = (sectionId: number) => {
    return mockEnhancedTables.filter(table => table.section_id === sectionId);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layout className="h-5 w-5" />
          Table Management - Organisation
        </CardTitle>
        <CardDescription>
          Manage table priorities, join groups, and online availability
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section-based Table Lists (like SectionTablesList) */}
        <div className="space-y-4">
          {mockSections.map(section => {
            const sectionTables = getSectionTables(section.id);
            
            if (sectionTables.length === 0) return null;

            return (
              <div key={section.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: section.color }}
                    />
                    <h3 className="font-semibold" style={{ color: section.color }}>
                      {section.name}
                    </h3>
                  </div>
                  <Badge variant="outline">
                    {sectionTables.length} tables
                  </Badge>
                </div>
                
                {/* Table List */}
                <div className="space-y-1">
                  {sectionTables.map((table) => (
                    <div key={table.id} className="flex items-center justify-between p-2 border rounded-md bg-background hover:bg-accent/5 transition-colors min-h-[40px]">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{table.label}</span>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs px-1 py-0 h-5">
                              <Users className="h-3 w-3 mr-0.5" />
                              {table.seats}
                            </Badge>
                            {table.join_groups && table.join_groups.length > 0 && (
                              <Badge variant="outline" className="text-xs px-1 py-0 h-5">
                                <Link className="h-3 w-3" />
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {table.online_bookable ? (
                            <Badge variant="default" className="text-xs px-1.5 py-0 h-5 bg-green-100 text-green-800 border-green-200">
                              <Check className="h-3 w-3 mr-0.5" />
                              Online
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                              <X className="h-3 w-3 mr-0.5" />
                              Offline
                            </Badge>
                          )}
                          
                          <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                            #{table.priority_rank}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Table Statistics */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {mockEnhancedTables.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Tables</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {mockEnhancedTables.filter(t => !getTableBookingStatus(t.id)).length}
              </div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {mockEnhancedTables.filter(t => getTableBookingStatus(t.id)).length}
              </div>
              <div className="text-sm text-muted-foreground">Reserved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {mockEnhancedTables.reduce((sum, t) => sum + t.seats, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Seats</div>
            </div>
          </div>
        </div>
        
        {/* Feature Highlights */}
        <div className="bg-muted/30 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Key Features:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              <span>Join Groups for Large Parties</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>Online Booking Controls</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Priority-Based Allocation</span>
            </div>
            <div className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              <span>Section-Based Organisation</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};