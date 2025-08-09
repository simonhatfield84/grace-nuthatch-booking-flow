
import { BookingProvider } from '../contexts/BookingContext';
import { BookingWidget } from './BookingWidget';
import { NuthatchHeader } from './shared/NuthatchHeader';

export const NuthatchBookingWidget = () => {
  // Hard-coded venue slug for The Nuthatch
  const venueSlug = 'the-nuthatch';
  
  console.log('🏠 NuthatchBookingWidget rendering with venue slug:', venueSlug);

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
