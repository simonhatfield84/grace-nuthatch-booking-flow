import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/toaster";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Tables from "./pages/Tables";
import Services from "./pages/Services";
import WiFi from "./pages/WiFi";
import WifiPortal from "./pages/WifiPortal";
import WifiPortalSuccess from "./pages/WifiPortalSuccess";
import Guests from "./pages/Guests";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Setup from "./pages/Setup";
import BookingWidget from "./pages/BookingWidget";
import ModifyBooking from "./pages/ModifyBooking";
import CancelBooking from "./pages/CancelBooking";
import NewHostInterface from "./pages/NewHostInterface";
import HostStylePreview from "./pages/HostStylePreview";
import HostThemeTools from "./pages/HostThemeTools";

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
          <div className="min-h-screen">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tables" element={<Tables />} />
              <Route path="/services" element={<Services />} />
              <Route path="/wifi" element={<WiFi />} />
              <Route path="/wifi-portal" element={<WifiPortal />} />
              <Route path="/wifi-success" element={<WifiPortalSuccess />} />
              <Route path="/guests" element={<Guests />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/setup" element={<Setup />} />
              <Route path="/book/:venueSlug" element={<BookingWidget />} />
              <Route path="/modify-booking/:bookingId" element={<ModifyBooking />} />
              <Route path="/cancel-booking/:bookingId" element={<CancelBooking />} />
              <Route path="/host" element={<NewHostInterface />} />
              <Route path="/host/style-preview" element={<HostStylePreview />} />
              <Route path="/host/theme-tools" element={<HostThemeTools />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
