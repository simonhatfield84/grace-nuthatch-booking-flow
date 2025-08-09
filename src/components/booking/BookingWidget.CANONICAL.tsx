
import { BookingProvider } from '@/features/booking/contexts/BookingContext';
import { BookingWidget } from '@/features/booking/components/BookingWidget';
import { NuthatchHeader } from '@/features/booking/components/shared/NuthatchHeader';

export const BookingWidgetCanonical = () => {
  // Hard-coded venue slug for The Nuthatch
  const venueSlug = 'the-nuthatch';
  
  console.log('🏠 BookingWidget.CANONICAL rendering with venue slug:', venueSlug);

  return (
    <div className="min-h-screen bg-nuthatch-cream">
      <NuthatchHeader />
      <div className="container mx-auto px-4 py-8">
        <BookingProvider>
          <BookingWidget venueSlug={venueSlug} />
        </BookingProvider>
      </div>
    </div>
  );
};
