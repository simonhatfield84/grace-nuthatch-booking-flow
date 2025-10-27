import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { V4BookingData } from "../V4BookingWidget";
import { V4WidgetConfig } from "@/hooks/useV4WidgetConfig";
import { AvailabilityApiClient } from "@/services/api/availabilityApiClient";
import { format } from "date-fns";
import { useSlotLock } from "@/features/booking/hooks/useSlotLock";
import { toast } from "sonner";

interface TimeStepProps {
  bookingData: V4BookingData;
  venueSlug: string;
  onUpdate: (updates: Partial<V4BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
  config?: V4WidgetConfig;
}

export function TimeStep({ bookingData, venueSlug, onUpdate, onNext, onBack, config }: TimeStepProps) {
  const { createLock } = useSlotLock();
  const [slots, setSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingLock, setIsCreatingLock] = useState(false);
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

  const handleTimeSelect = async (time: string) => {
    if (!bookingData.date || !bookingData.service) {
      toast.error("Missing booking information");
      return;
    }

    setSelectedTime(time);
    setIsCreatingLock(true);

    try {
      const lockCreated = await createLock(
        venueSlug,
        bookingData.service.id,
        format(bookingData.date, 'yyyy-MM-dd'),
        time,
        bookingData.partySize
      );

      if (lockCreated) {
        // Get lock token from localStorage (how useSlotLock stores it)
        const lockData = localStorage.getItem('grace.lock');
        const lockToken = lockData ? JSON.parse(lockData).lockToken : null;
        
        onUpdate({ time, lockToken });
        toast.success("Time slot reserved for 10 minutes");
      } else {
        setSelectedTime('');
        // Refresh slots after failed lock
        const response = await AvailabilityApiClient.checkAvailability({
          venueSlug,
          serviceId: bookingData.service.id,
          date: format(bookingData.date, 'yyyy-MM-dd'),
          partySize: bookingData.partySize
        });
        if (response.ok && response.slots) {
          setSlots(response.slots);
        }
      }
    } catch (error) {
      console.error('Error creating lock:', error);
      setSelectedTime('');
    } finally {
      setIsCreatingLock(false);
    }
  };

  const handleNext = () => {
    if (selectedTime && bookingData.lockToken) {
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
          disabled={!selectedTime || isCreatingLock || !bookingData.lockToken}
          className="flex-1 v4-btn-primary"
        >
          {isCreatingLock ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Reserving...
            </>
          ) : (
            config?.copy_json?.ctaText || 'Continue'
          )}
        </Button>
      </div>
    </div>
  );
}
