
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { RootRedirect } from '@/components/RootRedirect';

// Pages
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Bookings from '@/pages/Bookings';
import FloorPlan from '@/pages/FloorPlan';
import Guests from '@/pages/Guests';
import Settings from '@/pages/Settings';
import Reports from '@/pages/Reports';
import BookingManagement from '@/pages/BookingManagement';
import GuestDetail from '@/pages/GuestDetail';
import NotFound from '@/pages/NotFound';

// Layouts
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

// Booking Widget
import { PublicBookingWidget } from '@/pages/PublicBookingWidget';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<RootRedirect />} />
            
            {/* Authentication */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Public booking widget */}
            <Route path="/book/:venueSlug" element={<PublicBookingWidget />} />
            
            {/* Protected dashboard routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="bookings/:id" element={<BookingManagement />} />
              <Route path="floor-plan" element={<FloorPlan />} />
              <Route path="guests" element={<Guests />} />
              <Route path="guests/:id" element={<GuestDetail />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* 404 fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
