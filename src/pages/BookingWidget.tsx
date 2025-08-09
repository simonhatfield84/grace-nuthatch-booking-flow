
import { BookingFlowManager } from "@/components/bookings/BookingFlowManager";

const BookingWidgetPage = () => {
  // Hard-coded for The Nuthatch - using the original BookingFlowManager
  const venueSlug = 'the-nuthatch';
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <BookingFlowManager venueSlug={venueSlug} />
      </div>
    </div>
  );
};

export default BookingWidgetPage;
