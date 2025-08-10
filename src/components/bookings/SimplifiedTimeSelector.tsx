
// 🚨 DEPRECATED: This component is not used by the canonical NuthatchBookingWidget
// NuthatchBookingWidget uses its own TimeStep component
// This file will be removed in a future cleanup

console.warn('⚠️ DEPRECATED: SimplifiedTimeSelector is not used by NuthatchBookingWidget.');

import { useState, useEffect } from "react";
import { format, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { AvailabilityService } from "@/services/core/AvailabilityService";

interface SimplifiedTimeSelectorProps {
  selectedDate: Date | null;
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  selectedService: any;
  partySize: number;
  venueId: string;
}

export const SimplifiedTimeSelector = ({
  selectedDate,
  selectedTime,
  onTimeSelect,
  selectedService,
  partySize,
  venueId
}: SimplifiedTimeSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  useEffect(() => {
    const fetchAvailableTimes = async () => {
      if (!selectedDate) return;

      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      try {
        const timeSlots = await AvailabilityService.getAvailableTimeSlots(
          venueId,
          formattedDate,
          partySize
        );
        // Extract just the time strings from the time slot objects
        const times = timeSlots.filter(slot => slot.available).map(slot => slot.time);
        setAvailableTimes(times);
      } catch (error) {
        console.error("Error fetching available times:", error);
        setAvailableTimes([]);
      }
    };

    fetchAvailableTimes();
  }, [selectedDate, partySize, selectedService, venueId]);

  const handleTimeSelect = (time: string) => {
    onTimeSelect(time);
    setOpen(false);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Select Time</h2>

      {/* Date Display and Selector */}
      <div className="mb-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={() => {}} // Date is already selected in parent
              disabled={(date) =>
                date < new Date()
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Slot Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {availableTimes.length > 0 ? (
          availableTimes.map((time) => (
            <Button
              key={time}
              variant={selectedTime === time ? "default" : "outline"}
              onClick={() => handleTimeSelect(time)}
            >
              {time}
            </Button>
          ))
        ) : (
          <p>No times available for the selected date and party size.</p>
        )}
      </div>
    </div>
  );
};
