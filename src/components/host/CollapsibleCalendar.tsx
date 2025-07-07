
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { Button } from '@/components/ui/button';

interface CollapsibleCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  bookingDates: string[];
}

export const CollapsibleCalendar = ({ selectedDate, onDateSelect, bookingDates }: CollapsibleCalendarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
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

  const renderMonth = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div key={format(month, 'yyyy-MM')} className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white font-inter">
            {format(month, 'MMMM yyyy')}
          </h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="h-8 w-8 p-0 text-white hover:bg-[#676767]/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="h-8 w-8 p-0 text-white hover:bg-[#676767]/20"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-[#676767] p-2 font-inter">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const hasBookings = bookingDates.includes(dateStr);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, month);

            return (
              <button
                key={day.toISOString()}
                onClick={() => {
                  onDateSelect(day);
                  setIsOpen(false);
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
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="sm"
        className="bg-[#292C2D] hover:bg-[#676767]/20 text-white border border-[#676767]/20 rounded-xl shadow-lg font-inter"
      >
        <Calendar className="h-4 w-4 mr-2" />
        {format(selectedDate, 'MMM d, yyyy')}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 bg-[#292C2D] border border-[#676767]/20 rounded-2xl shadow-2xl p-6 z-50 w-80 max-h-96 overflow-y-auto scrollbar-hide">
          <div className="space-y-4">
            {renderMonth(currentMonth)}
            {renderMonth(addMonths(currentMonth, 1))}
          </div>
        </div>
      )}
    </div>
  );
};
