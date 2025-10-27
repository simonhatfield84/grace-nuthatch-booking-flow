import { CheckCircle, Loader2 } from "lucide-react";
import { V4BookingData } from "../V4BookingWidget";
import { V4WidgetConfig } from "@/hooks/useV4WidgetConfig";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ConfirmationStepProps {
  bookingData: V4BookingData;
  venueName: string;
  config?: V4WidgetConfig;
}

export function ConfirmationStep({ bookingData, venueName, config }: ConfirmationStepProps) {
  const [bookingReference, setBookingReference] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookingReference = async () => {
      if (bookingData.bookingId) {
        try {
          const { data, error } = await supabase
            .from('bookings')
            .select('booking_reference')
            .eq('id', bookingData.bookingId)
            .single();

          if (!error && data) {
            setBookingReference(data.booking_reference);
          }
        } catch (err) {
          console.error('Failed to fetch booking reference:', err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchBookingReference();
  }, [bookingData.bookingId]);

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
          <p className="text-sm text-muted-foreground">Booking Reference</p>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <p className="v4-body font-semibold">{bookingReference || 'Pending...'}</p>
          )}
        </div>
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
