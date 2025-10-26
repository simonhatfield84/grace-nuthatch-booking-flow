import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { V4BookingData } from "../V4BookingWidget";
import { V4WidgetConfig } from "@/hooks/useV4WidgetConfig";

interface PartyDateStepProps {
  bookingData: V4BookingData;
  onUpdate: (updates: Partial<V4BookingData>) => void;
  onNext: () => void;
  config?: V4WidgetConfig;
}

export function PartyDateStep({ bookingData, onUpdate, onNext, config }: PartyDateStepProps) {
  const isValid = bookingData.partySize > 0 && bookingData.date !== null;

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
        <Calendar
          mode="single"
          selected={bookingData.date || undefined}
          onSelect={(date) => onUpdate({ date: date || null })}
          disabled={(date) => date < new Date()}
          className="rounded-md border"
        />
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
