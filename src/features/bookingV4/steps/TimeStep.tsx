import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { V4BookingData } from "../V4BookingWidget";
import { V4WidgetConfig } from "@/hooks/useV4WidgetConfig";
import { AvailabilityApiClient } from "@/services/api/availabilityApiClient";
import { format } from "date-fns";

interface TimeStepProps {
  bookingData: V4BookingData;
  venueSlug: string;
  onUpdate: (updates: Partial<V4BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
  config?: V4WidgetConfig;
}

export function TimeStep({ bookingData, venueSlug, onUpdate, onNext, onBack, config }: TimeStepProps) {
  const [slots, setSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState(bookingData.time);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!bookingData.date || !bookingData.service) return;
      
      setIsLoading(true);
      try {
        const response = await AvailabilityApiClient.checkAvailability({
          venueSlug,
          serviceId: bookingData.service.id,
          date: format(bookingData.date, 'yyyy-MM-dd'),
          partySize: bookingData.partySize
        });

        if (response.ok && response.slots) {
          setSlots(response.slots);
        }
      } catch (error) {
        console.error('Error fetching availability:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlots();
  }, [bookingData.date, bookingData.service, bookingData.partySize, venueSlug]);

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    onUpdate({ time });
  };

  const handleNext = () => {
    if (selectedTime) {
      onNext();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const availableSlots = slots.filter(s => s.available);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="v4-heading text-2xl font-bold mb-2">Select Time</h2>
        <p className="v4-body text-muted-foreground">Choose your preferred time slot</p>
      </div>

      {availableSlots.length === 0 ? (
        <div className="text-center py-8">
          <h3 className="v4-heading text-lg font-semibold mb-2">
            {config?.copy_json?.emptyStateHeading || 'No Availability'}
          </h3>
          <p className="v4-body text-muted-foreground">
            {config?.copy_json?.emptyStateMessage || 'Please try another date or contact us directly.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {availableSlots.map((slot) => (
            <Button
              key={slot.time}
              variant={selectedTime === slot.time ? "default" : "outline"}
              className={selectedTime === slot.time ? "v4-slot-selected" : ""}
              onClick={() => handleTimeSelect(slot.time)}
            >
              {slot.time}
            </Button>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!selectedTime}
          className="flex-1 v4-btn-primary"
        >
          {config?.copy_json?.ctaText || 'Continue'}
        </Button>
      </div>
    </div>
  );
}
