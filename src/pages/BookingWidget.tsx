
import { BookingWidget } from "@/features/booking/components/BookingWidget";

const BookingWidgetPage = () => {
  // Hard-coded for The Nuthatch - using the original clean BookingWidget
  const venueSlug = 'the-nuthatch';
  
  return <BookingWidget venueSlug={venueSlug} />;
};

export default BookingWidgetPage;
