
import { format } from "date-fns";

interface TimeGridProps {
  venueHours: { start_time: string; end_time: string } | null;
  children?: React.ReactNode;
}

export const TimeGrid = ({ venueHours, children }: TimeGridProps) => {
  const generateTimeHeaders = () => {
    if (!venueHours) return [];
    
    const startHour = parseInt(venueHours.start_time.split(':')[0]);
    const endHour = parseInt(venueHours.end_time.split(':')[0]);
    const timeHeaders = [];
    
    for (let hour = startHour; hour <= endHour; hour++) {
      timeHeaders.push(format(new Date().setHours(hour, 0, 0, 0), 'HH:mm'));
    }
    
    return timeHeaders;
  };

  const timeHeaders = generateTimeHeaders();
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const startHour = venueHours ? parseInt(venueHours.start_time.split(':')[0]) : 17;

  // Calculate current time indicator position
  const currentTimePosition = venueHours && currentHour >= startHour 
    ? ((currentHour - startHour + currentTime.getMinutes() / 60) / timeHeaders.length) * 100 
    : -1;

  return (
    <div className="relative">
      {/* Time Headers */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-13 gap-0">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 font-semibold text-center border-r border-gray-200 dark:border-gray-700">
            Tables
          </div>
          {timeHeaders.map((time, index) => (
            <div 
              key={time} 
              className="bg-gray-50 dark:bg-gray-800 p-4 text-sm font-medium text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0 relative"
            >
              {time}
              {/* Current time indicator */}
              {currentTimePosition >= (index / timeHeaders.length) * 100 && 
               currentTimePosition < ((index + 1) / timeHeaders.length) * 100 && (
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                  style={{ 
                    left: `${((currentTimePosition - (index / timeHeaders.length) * 100) / (100 / timeHeaders.length)) * 100}%` 
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="relative">
        {children}
        
        {/* Current time line across all rows */}
        {currentTimePosition >= 0 && (
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
            style={{ left: `calc(${(1/13)*100}% + ${currentTimePosition * (12/13)}%)` }}
          >
            <div className="absolute -top-2 -left-6 bg-red-500 text-white text-xs px-2 py-1 rounded">
              {format(currentTime, 'HH:mm')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
