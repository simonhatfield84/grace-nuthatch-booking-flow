
// DEPRECATED — not used. Do not modify.
// This page has been replaced by the canonical NuthatchBookingWidget.
// The /booking route now uses NuthatchBookingWidget directly in App.tsx.

import { useEffect } from 'react';

const BookingWidgetPage = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ DEPRECATED: BookingWidget page is deprecated. Route /booking now uses NuthatchBookingWidget directly.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Deprecated Route</h1>
        <p className="text-gray-600">This booking widget page is deprecated.</p>
        <p className="text-gray-600">Please use the /booking route instead.</p>
      </div>
    </div>
  );
};

export default BookingWidgetPage;
