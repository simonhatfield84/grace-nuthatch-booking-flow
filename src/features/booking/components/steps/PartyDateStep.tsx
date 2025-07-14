import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, startOfDay, isBefore } from "date-fns";
import { Minus, Plus, Users, CalendarIcon, Loader2 } from "lucide-react";
import { BookingService } from '../../services/BookingService';

interface PartyDateStepProps {
  initialPartySize: number;
  selectedDate: Date | null;
  onContinue: (partySize: number, date: Date) => void;
  venueId: string;
  minSize?: number;
  maxSize?: number;
}

export function PartyDateStep({ 
  initialPartySize, 
  selectedDate,
  onContinue, 
  venueId,
  minSize = 1, 
  maxSize = 20 
}: PartyDateStepProps) {
  const [partySize, setPartySize] = useState(initialPartySize);
  const [inputValue, setInputValue] = useState(initialPartySize.toString());
  const [date, setDate] = useState<Date | null>(selectedDate);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: availableDates = [], isLoading } = useQuery({
    queryKey: ['available-dates', venueId, partySize, format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      if (!venueId) return [];

      console.log(`📅 Checking availability for ${format(currentMonth, 'yyyy-MM')} (${partySize} guests)`);
      
      const startDate = startOfDay(currentMonth);
      const endDate = addDays(startDate, 90);
      
      const availableDates = await BookingService.getAvailableDates(
        venueId,
        partySize,
        startDate,
        endDate
      );

      console.log(`✅ Found ${availableDates.length} available dates`);
      return availableDates;
    },
    enabled: !!venueId && partySize > 0,
    staleTime: 5 * 60 * 1000,
  });

  const handleIncrement = () => {
    const newSize = Math.min(partySize + 1, maxSize);
    setPartySize(newSize);
    setInputValue(newSize.toString());
  };

  const handleDecrement = () => {
    const newSize = Math.max(partySize - 1, minSize);
    setPartySize(newSize);
    setInputValue(newSize.toString());
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= minSize && numValue <= maxSize) {
      setPartySize(numValue);
    }
  };

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue);
    if (isNaN(numValue) || numValue < minSize || numValue > maxSize) {
      setInputValue(partySize.toString());
    }
  };

  const disabledDates = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) {
      return true;
    }
    
    if (isLoading) {
      return false;
    }
    
    const dateStr = format(date, 'yyyy-MM-dd');
    return !availableDates.includes(dateStr);
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      console.log(`📅 Date selected: ${format(selectedDate, 'yyyy-MM-dd')}`);
      setDate(selectedDate);
      // Auto-advance to next step
      onContinue(partySize, selectedDate);
    }
  };

  const commonSizes = [2, 4, 6, 8];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-nuthatch-heading font-light text-nuthatch-dark mb-2">
          How many guests?
        </h2>
        <p className="text-nuthatch-muted">
          Select your party size and preferred date
        </p>
      </div>

      {/* Party Size Section */}
      <Card className="border-nuthatch-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-nuthatch-dark">
            <Users className="h-5 w-5 text-nuthatch-green" />
            Party Size
          </CardTitle>
          <CardDescription className="text-nuthatch-muted">
            Select your party size
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick selection buttons */}
          <div className="grid grid-cols-4 gap-2">
            {commonSizes.map((size) => (
              <Button
                key={size}
                variant={partySize === size ? "default" : "outline"}
                onClick={() => {
                  setPartySize(size);
                  setInputValue(size.toString());
                }}
                className={`h-12 ${
                  partySize === size 
                    ? 'bg-nuthatch-green hover:bg-nuthatch-dark text-white' 
                    : 'border-nuthatch-border text-nuthatch-dark hover:bg-nuthatch-light'
                }`}
              >
                {size}
              </Button>
            ))}
          </div>

          {/* +/- controls only */}
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecrement}
              disabled={partySize <= minSize}
              className="border-nuthatch-border text-nuthatch-dark hover:bg-nuthatch-light h-10 w-10"
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <span className="text-lg font-medium text-nuthatch-dark min-w-[2rem] text-center">
                {partySize}
              </span>
              <span className="text-sm text-nuthatch-muted">guests</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleIncrement}
              disabled={partySize >= maxSize}
              className="border-nuthatch-border text-nuthatch-dark hover:bg-nuthatch-light h-10 w-10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Date Selection Section */}
      <Card className="border-nuthatch-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-nuthatch-dark">
            <CalendarIcon className="h-5 w-5 text-nuthatch-green" />
            Select Date
          </CardTitle>
          <CardDescription className="text-nuthatch-muted">
            Choose your preferred date for {partySize} {partySize === 1 ? 'person' : 'people'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-nuthatch-green" />
              <p className="text-nuthatch-muted">
                Checking availability...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                onMonthChange={setCurrentMonth}
                disabled={disabledDates}
                className="mx-auto"
                fromDate={new Date()}
                toDate={addDays(new Date(), 90)}
              />
              
              <div className="text-center text-sm text-nuthatch-muted">
                {availableDates.length === 0 && !isLoading ? (
                  <p className="text-amber-600">
                    No availability found for {partySize} {partySize === 1 ? 'person' : 'people'} this month.
                    Try selecting a different month or reducing your party size.
                  </p>
                ) : (
                  <p>
                    {availableDates.length} {availableDates.length === 1 ? 'date' : 'dates'} available this month
                  </p>
                )}
              </div>

              {date && (
                <div className="mt-4 p-3 bg-nuthatch-light rounded-lg border border-nuthatch-border">
                  <p className="text-nuthatch-dark text-center">
                    <strong>{format(date, 'EEEE, MMMM do, yyyy')}</strong> selected
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* No continue button needed - auto-advance on date selection */}
    </div>
  );
}