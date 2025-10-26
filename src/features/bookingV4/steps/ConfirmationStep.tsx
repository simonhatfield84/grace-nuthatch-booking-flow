import { CheckCircle } from "lucide-react";
import { V4BookingData } from "../V4BookingWidget";
import { V4WidgetConfig } from "@/hooks/useV4WidgetConfig";
import { format } from "date-fns";

interface ConfirmationStepProps {
  bookingData: V4BookingData;
  venueName: string;
  config?: V4WidgetConfig;
}

export function ConfirmationStep({ bookingData, venueName, config }: ConfirmationStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <CheckCircle className="h-16 w-16 text-green-500" />
      </div>

      <div>
        <h2 className="v4-heading text-2xl font-bold mb-2">Booking Confirmed!</h2>
        <p className="v4-body text-muted-foreground">
          Your reservation at {venueName} has been confirmed
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 text-left space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">Date</p>
          <p className="v4-body font-semibold">
            {bookingData.date ? format(bookingData.date, 'EEEE, MMMM d, yyyy') : '-'}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Time</p>
          <p className="v4-body font-semibold">{bookingData.time}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Party Size</p>
          <p className="v4-body font-semibold">
            {bookingData.partySize} {bookingData.partySize === 1 ? 'guest' : 'guests'}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Service</p>
          <p className="v4-body font-semibold">{bookingData.service?.title}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Name</p>
          <p className="v4-body font-semibold">{bookingData.guestDetails?.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="v4-body font-semibold">{bookingData.guestDetails?.email}</p>
        </div>
      </div>

      <p className="v4-body text-sm text-muted-foreground">
        A confirmation email has been sent to {bookingData.guestDetails?.email}
      </p>
    </div>
  );
}
