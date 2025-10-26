import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { V4BookingData } from "../V4BookingWidget";
import { V4WidgetConfig } from "@/hooks/useV4WidgetConfig";
import { useQuery } from "@tanstack/react-query";
import { AvailabilityService } from "@/services/core/AvailabilityService";
import { Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useState } from "react";

interface PartyDateStepProps {
  bookingData: V4BookingData;
  venueId: string;
  onUpdate: (updates: Partial<V4BookingData>) => void;
  onNext: () => void;
  config?: V4WidgetConfig;
}

export function PartyDateStep({ bookingData, venueId, onUpdate, onNext, config }: PartyDateStepProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Fetch available dates for the selected party size and current month
  const { data: availableDates = [], isLoading: datesLoading } = useQuery({
    queryKey: ['v4-available-dates', venueId, bookingData.partySize, format(currentMonth, 'yyyy-MM')],
    queryFn: () => AvailabilityService.getAvailableDates(
      venueId,
      bookingData.partySize,
      startOfMonth(currentMonth),
      endOfMonth(currentMonth)
    ),
    enabled: !!venueId && bookingData.partySize > 0,
    staleTime: 5 * 60 * 1000,
  });

  const isValid = bookingData.partySize > 0 && bookingData.date !== null;

  const disabledDates = (date: Date) => {
    // Disable past dates
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
    
    // Disable dates not in availableDates
    const dateStr = format(date, 'yyyy-MM-dd');
    return !availableDates.includes(dateStr);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="v4-heading text-2xl font-bold mb-2">Select Party Size & Date</h2>
        <p className="v4-body text-muted-foreground">Choose how many guests and when you'd like to visit</p>
      </div>

      <div className="space-y-2">
        <Label>Party Size</Label>
        <Select
          value={bookingData.partySize.toString()}
          onValueChange={(value) => onUpdate({ partySize: parseInt(value) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
              <SelectItem key={num} value={num.toString()}>
                {num} {num === 1 ? 'Guest' : 'Guests'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Select Date</Label>
        {datesLoading ? (
          <div className="flex items-center justify-center py-8 border rounded-md">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : availableDates.length === 0 ? (
          <div className="p-8 border rounded-md text-center">
            <p className="text-muted-foreground">
              No availability found for {bookingData.partySize} {bookingData.partySize === 1 ? 'guest' : 'guests'} in this period.
              Try selecting a different party size.
            </p>
          </div>
        ) : (
          <Calendar
            mode="single"
            selected={bookingData.date || undefined}
            onSelect={(date) => onUpdate({ date: date || null })}
            onMonthChange={setCurrentMonth}
            disabled={disabledDates}
            className="rounded-md border"
          />
        )}
      </div>

      <Button
        onClick={onNext}
        disabled={!isValid}
        className="w-full v4-btn-primary"
      >
        {config?.copy_json?.ctaText || 'Continue'}
      </Button>
    </div>
  );
}
