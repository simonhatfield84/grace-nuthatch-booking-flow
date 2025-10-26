import { V4BookingWidget } from "@/features/bookingV4/V4BookingWidget";
import { StripeProvider } from "@/components/providers/StripeProvider";

export default function V4BookingPage() {
  return (
    <StripeProvider>
      <V4BookingWidget />
    </StripeProvider>
  );
}
