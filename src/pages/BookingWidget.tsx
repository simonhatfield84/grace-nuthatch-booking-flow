import { Navigate } from "react-router-dom";

const BookingWidgetPage = () => {
  // Redirect to slug-based route for backward compatibility
  return <Navigate to="/booking/the-nuthatch" replace />;
};

export default BookingWidgetPage;
