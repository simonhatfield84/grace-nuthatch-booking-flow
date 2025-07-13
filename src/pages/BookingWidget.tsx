
import { useParams } from "react-router-dom";
import { BookingWidget } from "@/features/booking/components/BookingWidget";

const BookingWidgetPage = () => {
  const { venueSlug } = useParams<{ venueSlug: string }>();

  if (!venueSlug) {
    return <div>Invalid venue</div>;
  }

  return <BookingWidget venueSlug={venueSlug} />;
};

export default BookingWidgetPage;
