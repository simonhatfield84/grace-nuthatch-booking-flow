
import { useEffect, useState } from "react";
import { format, addMinutes } from "date-fns";

interface Table {
  id: number;
  label: string;
  seats: number;
  join_groups: number[];
  section_id: number | null;
  status: 'active' | 'deleted';
  online_bookable: boolean;
  priority_rank: number;
  position_x: number;
  position_y: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Section {
  id: number;
  name: string;
  color: string;
}

interface OptimizedTimeGridProps {
  venueHours: { start_time: string; end_time: string } | null;
  tables: Table[];
  sections: Section[];
  children?: React.ReactNode;
  onTableRowRender?: (table: Table, section: Section) => React.ReactNode;
}

export const OptimizedTimeGrid = ({ venueHours, tables, sections, children, onTableRowRender }: OptimizedTimeGridProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  console.log("OptimizedTimeGrid rendered successfully");
  
  const generateTimeSlots = () => {
    if (!venueHours) return [];
    
    const [startHour, startMin] = venueHours.start_time.split(':').map(Number);
    const [endHour, endMin] = venueHours.end_time.split(':').map(Number);
    
    const startTime = new Date();
    startTime.setHours(startHour, startMin, 0, 0);
    
    const endTime = new Date();
    endTime.setHours(endHour, endMin, 0, 0);
    
    const timeSlots = [];
    let currentTime = new Date(startTime);
    
    while (currentTime <= endTime) {
      timeSlots.push(format(currentTime, 'HH:mm'));
      currentTime = addMinutes(currentTime, 15);
    }
    
    return timeSlots;
  };

  const timeSlots = generateTimeSlots();
  const currentTimeStr = format(currentTime, 'HH:mm');
  
  const getCurrentTimePosition = () => {
    if (!venueHours) return -1;
    
    const [startHour, startMin] = venueHours.start_time.split(':').map(Number);
    const [endHour, endMin] = venueHours.end_time.split(':').map(Number);
    const currentHour = currentTime.getHours();
    const currentMin = currentTime.getMinutes();
    
    // Only show current time line during operating hours
    const currentTotalMin = currentHour * 60 + currentMin;
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    
    if (currentTotalMin < startTotalMin || currentTotalMin > endTotalMin) return -1;
    
    const diffMin = currentTotalMin - startTotalMin;
    return (diffMin / 15) * 60; // 60px per 15-minute slot
  };

  const currentTimePosition = getCurrentTimePosition();

  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-lg border">
      {/* Time Headers */}
      <div className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
        <div className="flex">
          {/* Table Header - Fixed position */}
          <div className="w-48 p-3 font-semibold text-center border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex-shrink-0 sticky left-0 z-10">
            Tables
          </div>
          
          {/* Time Slots Container - Scrollable */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex" style={{ minWidth: `${timeSlots.length * 60}px` }}>
              {timeSlots.map((time, index) => (
                <div 
                  key={time} 
                  className="w-[60px] p-3 text-xs font-medium text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0 relative bg-gray-50 dark:bg-gray-800 flex-shrink-0"
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
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative">
        {/* Render sections and tables */}
        {sections.map((section) => {
          const sectionTables = tables.filter(table => table.section_id === section.id && table.status === 'active');
          
          if (sectionTables.length === 0) return null;

          return (
            <div key={section.id}>
              {/* Section Header */}
              <div 
                className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center sticky left-0 z-10"
                style={{ borderLeftColor: section.color, borderLeftWidth: '4px' }}
              >
                <div className="w-48 flex-shrink-0">
                  <h3 className="font-semibold" style={{ color: section.color }}>
                    {section.name} ({sectionTables.length})
                  </h3>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <div style={{ minWidth: `${timeSlots.length * 60}px` }}></div>
                </div>
              </div>

              {/* Table Rows */}
              {sectionTables.map((table) => (
                <div key={table.id} className="flex border-b border-gray-100 dark:border-gray-800 min-h-[48px]">
                  {/* Fixed Table Name Column */}
                  <div className="w-48 p-3 border-r border-gray-200 dark:border-gray-700 flex items-center bg-white dark:bg-gray-900 flex-shrink-0 sticky left-0 z-10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{table.label}</span>
                        <span className="text-xs text-gray-500 px-1 py-0 border border-gray-300 rounded">
                          {table.seats}
                        </span>
                        {table.join_groups && table.join_groups.length > 0 && (
                          <span className="text-xs text-blue-600">🔗</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Content Area */}
                  <div className="flex-1 overflow-x-auto">
                    <div 
                      className="relative bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 min-h-[48px]"
                      style={{ minWidth: `${timeSlots.length * 60}px` }}
                    >
                      {onTableRowRender && onTableRowRender(table, section)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
        
        {/* Current time line across all rows */}
        {currentTimePosition >= 0 && (
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
            style={{ left: `${192 + currentTimePosition}px` }}
          >
            <div className="absolute -top-2 -left-6 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {currentTimeStr}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
