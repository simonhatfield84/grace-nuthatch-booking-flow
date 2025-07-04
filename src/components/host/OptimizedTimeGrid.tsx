
import { format, addMinutes } from "date-fns";

interface OptimizedTimeGridProps {
  venueHours: { start_time: string; end_time: string } | null;
  children?: React.ReactNode;
}

export const OptimizedTimeGrid = ({ venueHours, children }: OptimizedTimeGridProps) => {
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
  const currentTime = new Date();
  const currentTimeStr = format(currentTime, 'HH:mm');
  
  // Calculate current time position
  const getCurrentTimePosition = () => {
    if (!venueHours) return -1;
    
    const [startHour] = venueHours.start_time.split(':').map(Number);
    const currentHour = currentTime.getHours();
    const currentMin = currentTime.getMinutes();
    
    if (currentHour < startHour) return -1;
    
    const totalMinutesFromStart = (currentHour - startHour) * 60 + currentMin;
    const totalSlotsWidth = timeSlots.length * 60; // Each slot is 60px wide
    
    return (totalMinutesFromStart / 15) * 60; // 15 minutes per slot, 60px per slot
  };

  const currentTimePosition = getCurrentTimePosition();

  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-lg border">
      {/* Time Headers */}
      <div className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
        <div className="flex">
          {/* Table Header */}
          <div className="w-48 p-3 font-semibold text-center border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
            Tables
          </div>
          
          {/* Time Slots */}
          <div className="flex flex-1 overflow-x-auto">
            {timeSlots.map((time, index) => (
              <div 
                key={time} 
                className="min-w-[60px] p-3 text-xs font-medium text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0 relative bg-gray-50 dark:bg-gray-800"
              >
                {time}
                {/* Current time indicator in header */}
                {currentTimeStr >= time && 
                 currentTimeStr < (timeSlots[index + 1] || '23:59') && 
                 currentTimePosition >= 0 && (
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                    style={{ 
                      left: `${((currentTime.getMinutes() % 15) / 15) * 100}%` 
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative">
        {children}
        
        {/* Current time line across all rows */}
        {currentTimePosition >= 0 && (
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
            style={{ left: `${192 + currentTimePosition}px` }} // 192px is table column width
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
