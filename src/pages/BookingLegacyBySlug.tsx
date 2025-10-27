import { useParams } from 'react-router-dom';
import { LegacyBookingWidget } from '@/features/booking/components/LegacyBookingWidget';
import { StripeProvider } from '@/components/providers/StripeProvider';
import { Card } from '@/components/ui/card';

export default function BookingLegacyBySlug() {
  const { venueSlug } = useParams<{ venueSlug: string }>();
  
  if (!venueSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md p-6 text-center">
          <p className="text-gray-600">Invalid booking URL</p>
        </Card>
      </div>
    );
  }
  
  return (
    <StripeProvider>
      <LegacyBookingWidget venueSlug={venueSlug} />
    </StripeProvider>
  );
}
