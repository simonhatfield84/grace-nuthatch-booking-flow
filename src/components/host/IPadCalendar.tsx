
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";

interface IPadCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  bookingDates: string[];
}

export const IPadCalendar = ({ selectedDate, onDateSelect, bookingDates }: IPadCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
  };

  const hasBookings = (date: Date) => {
    return bookingDates.includes(format(date, 'yyyy-MM-dd'));
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth} className="min-h-[44px]">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth} className="min-h-[44px]">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday} className="w-full min-h-[44px]">
          Today
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const dayHasBookings = hasBookings(day);
            
            return (
              <div key={day.toISOString()} className="relative">
                <Button
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  className={`
                    h-12 w-full p-0 text-sm relative
                    ${!isCurrentMonth ? 'text-muted-foreground opacity-50' : ''}
                    ${isToday ? 'border border-primary' : ''}
                    ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                  `}
                  onClick={() => onDateSelect(day)}
                >
                  {format(day, 'd')}
                </Button>
                {dayHasBookings && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
