
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addDays, isToday, isTomorrow } from 'date-fns';
import { Button } from '@/components/ui/button';

interface CollapsibleCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  bookingDates: string[];
}

export const CollapsibleCalendar = ({ selectedDate, onDateSelect, bookingDates }: CollapsibleCalendarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCalendarToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    setIsOpen(false);
  };

  const handleTodayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    setCurrentMonth(today);
    handleDateSelect(today);
  };

  const handleTomorrowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const tomorrow = addDays(new Date(), 1);
    setCurrentMonth(tomorrow);
    handleDateSelect(tomorrow);
  };

  const renderMonth = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    // Create a full calendar grid with proper week structure (Monday start)
    const startDate = new Date(monthStart);
    const dayOfWeek = monthStart.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so 6 days from Monday
    startDate.setDate(startDate.getDate() - daysFromMonday);
    
    const endDate = new Date(monthEnd);
    const endDayOfWeek = monthEnd.getDay();
    const daysToSunday = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;
    endDate.setDate(endDate.getDate() + daysToSunday);
    
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="space-y-4">
        {/* Quick action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleTodayClick}
            variant="ghost"
            size="sm"
            className={`flex-1 h-8 text-xs font-inter transition-all duration-200 ${
              isToday(selectedDate) 
                ? 'bg-[#CCF0DB] text-[#111315] font-semibold' 
                : 'text-white hover:bg-[#676767]/20'
            }`}
          >
            Today
          </Button>
          <Button
            onClick={handleTomorrowClick}
            variant="ghost"
            size="sm"
            className={`flex-1 h-8 text-xs font-inter transition-all duration-200 ${
              isTomorrow(selectedDate) 
                ? 'bg-[#CCF0DB] text-[#111315] font-semibold' 
                : 'text-white hover:bg-[#676767]/20'
            }`}
          >
            Tomorrow
          </Button>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentMonth(subMonths(currentMonth, 1));
            }}
            className="h-8 w-8 p-0 text-white hover:bg-[#676767]/20"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h3 className="text-lg font-semibold text-white font-inter">
            {format(month, 'MMMM yyyy')}
          </h3>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentMonth(addMonths(currentMonth, 1));
            }}
            className="h-8 w-8 p-0 text-white hover:bg-[#676767]/20"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-[#676767] p-2 font-inter">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {allDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const hasBookings = bookingDates.includes(dateStr);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, month);

            return (
              <button
                key={day.toISOString()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDateSelect(day);
                }}
                className={`
                  relative p-2 text-sm rounded-lg transition-all duration-200 font-inter
                  ${isSelected 
                    ? 'bg-[#CCF0DB] text-[#111315] font-semibold shadow-md' 
                    : isCurrentMonth
                    ? 'text-white hover:bg-[#676767]/20'
                    : 'text-[#676767]/50'
                  }
                  ${hasBookings && !isSelected ? 'after:absolute after:bottom-1 after:left-1/2 after:transform after:-translate-x-1/2 after:w-1 after:h-1 after:bg-[#CCF0DB] after:rounded-full' : ''}
                `}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative" ref={calendarRef}>
      <Button
        onClick={handleCalendarToggle}
        variant="ghost"
        size="sm"
        className="bg-[#292C2D] hover:bg-[#676767]/20 text-white border border-[#676767]/20 rounded-xl shadow-lg font-inter"
      >
        <Calendar className="h-4 w-4 mr-2" />
        {format(selectedDate, 'MMM d, yyyy')}
      </Button>

      {isOpen && (
        <div 
          className="absolute right-0 top-12 bg-[#292C2D] border border-[#676767]/20 rounded-2xl shadow-2xl p-6 z-50 w-80"
          onClick={(e) => e.stopPropagation()}
        >
          {renderMonth(currentMonth)}
        </div>
      )}
    </div>
  );
};
