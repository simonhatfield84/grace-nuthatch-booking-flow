
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, isToday } from "date-fns";

interface DateNavigatorProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export const DateNavigator = ({ selectedDate, onDateSelect }: DateNavigatorProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthsToShow = [
    currentMonth,
    addMonths(currentMonth, 1),
    addMonths(currentMonth, 2)
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(direction === 'next' ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1));
  };

  const renderMonth = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div key={month.toISOString()} className="mb-6">
        <h3 className="text-sm font-medium mb-2 text-center">
          {format(month, 'MMMM yyyy')}
        </h3>
        <div className="grid grid-cols-7 gap-1 text-xs">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="p-1 text-center text-muted-foreground font-medium">
              {day}
            </div>
          ))}
          {days.map(day => (
            <Button
              key={day.toISOString()}
              variant={isSameDay(day, selectedDate) ? "default" : "ghost"}
              size="sm"
              className={`h-8 w-8 p-0 ${isToday(day) ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => onDateSelect(day)}
            >
              {format(day, 'd')}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-80">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {format(currentMonth, 'yyyy')}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {monthsToShow.map(renderMonth)}
      </CardContent>
    </Card>
  );
};
