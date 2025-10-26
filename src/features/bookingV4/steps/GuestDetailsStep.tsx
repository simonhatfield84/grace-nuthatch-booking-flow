import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { V4BookingData } from "../V4BookingWidget";
import { V4WidgetConfig } from "@/hooks/useV4WidgetConfig";

interface GuestDetailsStepProps {
  bookingData: V4BookingData;
  onUpdate: (updates: Partial<V4BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
  config?: V4WidgetConfig;
}

export function GuestDetailsStep({ bookingData, onUpdate, onNext, onBack, config }: GuestDetailsStepProps) {
  const [details, setDetails] = useState({
    name: bookingData.guestDetails?.name || '',
    email: bookingData.guestDetails?.email || '',
    phone: bookingData.guestDetails?.phone || '',
    notes: bookingData.guestDetails?.notes || '',
    marketingOptIn: bookingData.guestDetails?.marketingOptIn || false,
    termsAccepted: bookingData.guestDetails?.termsAccepted || false
  });

  const isValid = details.name && details.email && details.phone && details.termsAccepted;

  const handleSubmit = () => {
    onUpdate({ guestDetails: details });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="v4-heading text-2xl font-bold mb-2">Your Details</h2>
        <p className="v4-body text-muted-foreground">Please provide your contact information</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={details.name}
            onChange={(e) => setDetails({ ...details, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={details.email}
            onChange={(e) => setDetails({ ...details, email: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            type="tel"
            value={details.phone}
            onChange={(e) => setDetails({ ...details, phone: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Special Requests (optional)</Label>
          <Textarea
            id="notes"
            value={details.notes}
            onChange={(e) => setDetails({ ...details, notes: e.target.value })}
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="marketing"
            checked={details.marketingOptIn}
            onCheckedChange={(checked) => setDetails({ ...details, marketingOptIn: checked as boolean })}
          />
          <Label htmlFor="marketing" className="text-sm">
            I'd like to receive updates and offers
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={details.termsAccepted}
            onCheckedChange={(checked) => setDetails({ ...details, termsAccepted: checked as boolean })}
          />
          <Label htmlFor="terms" className="text-sm">
            I accept the terms and conditions *
          </Label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isValid}
          className="flex-1 v4-btn-primary"
        >
          {config?.copy_json?.ctaText || 'Continue'}
        </Button>
      </div>
    </div>
  );
}
