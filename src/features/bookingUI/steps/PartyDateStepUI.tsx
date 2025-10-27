import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus, Users } from 'lucide-react';
import { CalendarUI } from '../ui/CalendarUI';
import { format } from 'date-fns';

interface PartyDateStepUIProps {
  initialPartySize?: number;
  selectedDate?: Date;
  onContinue: (partySize: number, date: Date) => void;
  minSize?: number;
  maxSize?: number;
}

export function PartyDateStepUI({
  initialPartySize = 2,
  selectedDate,
  onContinue,
  minSize = 1,
  maxSize = 50,
}: PartyDateStepUIProps) {
  const [partySize, setPartySize] = useState(initialPartySize);
  const [inputValue, setInputValue] = useState(initialPartySize.toString());
  const [date, setDate] = useState<Date | undefined>(selectedDate);
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate || new Date());

  const quickSizes = [2, 4, 6, 8];

  const handleIncrement = () => {
    if (partySize < maxSize) {
      const newSize = partySize + 1;
      setPartySize(newSize);
      setInputValue(newSize.toString());
    }
  };

  const handleDecrement = () => {
    if (partySize > minSize) {
      const newSize = partySize - 1;
      setPartySize(newSize);
      setInputValue(newSize.toString());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= minSize && numValue <= maxSize) {
      setPartySize(numValue);
    }
  };

  const handleInputBlur = () => {
    setInputValue(partySize.toString());
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      // Auto-continue when date is selected
      onContinue(partySize, selectedDate);
    }
  };

  return (
    <div className="space-y-6">
      {/* Party Size Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-nuthatch-dark font-nuthatch-heading">
            <Users className="h-5 w-5" />
            Party Size
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Selection Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {quickSizes.map((size) => (
              <Button
                key={size}
                variant={partySize === size ? "default" : "outline"}
                onClick={() => {
                  setPartySize(size);
                  setInputValue(size.toString());
                }}
                className="h-12"
              >
                {size}
              </Button>
            ))}
          </div>

          {/* Custom Input with +/- Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDecrement}
              disabled={partySize <= minSize}
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <div className="flex-1 text-center">
              <Input
                type="number"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                min={minSize}
                max={maxSize}
                className="text-center text-lg font-medium"
              />
              <p className="text-sm text-nuthatch-muted mt-1">
                {partySize} {partySize === 1 ? 'guest' : 'guests'}
              </p>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleIncrement}
              disabled={partySize >= maxSize}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Date Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-nuthatch-dark font-nuthatch-heading">
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CalendarUI
            selected={date}
            onSelect={handleDateSelect}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
          />
          
          {date && (
            <div className="text-center p-3 bg-nuthatch-light rounded-lg">
              <p className="text-sm text-nuthatch-muted">Selected date</p>
              <p className="font-medium text-nuthatch-dark">
                {format(date, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
