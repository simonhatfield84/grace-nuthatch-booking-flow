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
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Layout className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Table Management - Organisation</span>
          <span className="sm:hidden">Table Management</span>
        </CardTitle>
        <CardDescription className="text-sm">
          Manage table priorities, join groups, and online availability
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
        {/* Section-based Table Lists (like SectionTablesList) */}
        <div className="space-y-3 sm:space-y-4">
          {mockSections.map(section => {
            const sectionTables = getSectionTables(section.id);
            
            if (sectionTables.length === 0) return null;

            return (
              <div key={section.id} className="border rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: section.color }}
                    />
                    <h3 className="font-semibold text-sm sm:text-base" style={{ color: section.color }}>
                      {section.name}
                    </h3>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {sectionTables.length} tables
                  </Badge>
                </div>
                
                {/* Table List */}
                <div className="space-y-1">
                  {sectionTables.map((table) => (
                    <div key={table.id} className="flex items-center justify-between p-2 border rounded-md bg-background hover:bg-accent/5 transition-colors min-h-[36px] sm:min-h-[40px]">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                          <span className="font-medium text-sm truncate">{table.label}</span>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs px-1 py-0 h-4 sm:h-5">
                              <Users className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5" />
                              {table.seats}
                            </Badge>
                            {table.join_groups && table.join_groups.length > 0 && (
                              <Badge variant="outline" className="text-xs px-1 py-0 h-4 sm:h-5">
                                <Link className="h-2 w-2 sm:h-3 sm:w-3" />
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {table.online_bookable ? (
                            <Badge variant="default" className="text-xs px-1 sm:px-1.5 py-0 h-4 sm:h-5 bg-green-100 text-green-800 border-green-200">
                              <Check className="h-2 w-2 sm:h-3 sm:w-3 sm:mr-0.5" />
                              <span className="hidden sm:inline">Online</span>
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs px-1 sm:px-1.5 py-0 h-4 sm:h-5">
                              <X className="h-2 w-2 sm:h-3 sm:w-3 sm:mr-0.5" />
                              <span className="hidden sm:inline">Offline</span>
                            </Badge>
                          )}
                          
                          <Badge variant="outline" className="text-xs px-1 sm:px-1.5 py-0 h-4 sm:h-5">
                            #{table.priority_rank}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 flex-shrink-0">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-5 w-5 sm:h-6 sm:w-6 p-0"
                        >
                          <Edit className="h-2 w-2 sm:h-3 sm:w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-2 w-2 sm:h-3 sm:w-3" />
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
        <div className="border-t pt-3 sm:pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-primary">
                {mockEnhancedTables.length}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Total Tables</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-green-600">
                {mockEnhancedTables.filter(t => !getTableBookingStatus(t.id)).length}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Available</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-amber-600">
                {mockEnhancedTables.filter(t => getTableBookingStatus(t.id)).length}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Reserved</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-blue-600">
                {mockEnhancedTables.reduce((sum, t) => sum + t.seats, 0)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Total Seats</div>
            </div>
          </div>
        </div>
        
        {/* Feature Highlights */}
        <div className="bg-muted/30 p-3 sm:p-4 rounded-lg">
          <h4 className="font-medium mb-2 text-sm sm:text-base">Key Features:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Link className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>Join Groups for Large Parties</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>Online Booking Controls</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>Priority-Based Allocation</span>
            </div>
            <div className="flex items-center gap-2">
              <Layout className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>Section-Based Organisation</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};