
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Import pages
import HomePage from "@/pages/HomePage";
import Auth from "@/pages/Auth";
import PlatformAuth from "@/pages/PlatformAuth";
import Setup from "@/pages/Setup";
import Dashboard from "@/pages/Dashboard";
import NewHostInterface from "@/pages/NewHostInterface";
import WiFi from "@/pages/WiFi";
import Tables from "@/pages/Tables";
import Guests from "@/pages/Guests";
import Services from "@/pages/Services";
import Settings from "@/pages/Settings";
import Reports from "@/pages/Reports";
import BookingWidget from "@/pages/BookingWidget";
import ModifyBooking from "@/pages/ModifyBooking";
import CancelBooking from "@/pages/CancelBooking";
import NotFound from "@/pages/NotFound";
import { WifiPortal } from "@/pages/WifiPortal";
import { WifiPortalSuccess } from "@/pages/WifiPortalSuccess";

// Platform admin pages
import PlatformDashboard from "@/pages/PlatformDashboard";
import PlatformVenues from "@/pages/PlatformVenues";
import PlatformUsers from "@/pages/PlatformUsers";
import PlatformSecurity from "@/pages/PlatformSecurity";
import PlatformSubscriptions from "@/pages/PlatformSubscriptions";
import PlatformSettings from "@/pages/PlatformSettings";
import PlatformSupport from "@/pages/PlatformSupport";

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
      <ThemeProvider defaultTheme="light" storageKey="ui-theme">
        <AuthProvider>
          <Toaster />
          <ErrorBoundary>
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/platform/auth" element={<PlatformAuth />} />
                <Route path="/setup" element={<Setup />} />
                
                {/* WiFi Portal routes - public access */}
                <Route path="/wifiportal/:venueSlug" element={<WifiPortal />} />
                <Route path="/wifiportal/success/:venueSlug" element={<WifiPortalSuccess />} />

                {/* Booking widget routes */}
                <Route path="/book/:venueSlug" element={<BookingWidget />} />
                <Route path="/book/:venueSlug/service/:serviceSlug" element={<BookingWidget />} />
                <Route path="/modify/:token" element={<ModifyBooking />} />
                <Route path="/cancel/:token" element={<CancelBooking />} />

                {/* Protected admin routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/host" 
                  element={
                    <ProtectedRoute>
                      <NewHostInterface />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/wifi" 
                  element={
                    <ProtectedRoute>
                      <WiFi />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/tables" 
                  element={
                    <ProtectedRoute>
                      <Tables />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/guests" 
                  element={
                    <ProtectedRoute>
                      <Guests />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/services" 
                  element={
                    <ProtectedRoute>
                      <Services />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/reports" 
                  element={
                    <ProtectedRoute>
                      <Reports />
                    </ProtectedRoute>
                  } 
                />

                {/* Platform admin routes */}
                <Route 
                  path="/platform" 
                  element={
                    <ProtectedRoute>
                      <PlatformDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/platform/venues" 
                  element={
                    <ProtectedRoute>
                      <PlatformVenues />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/platform/users" 
                  element={
                    <ProtectedRoute>
                      <PlatformUsers />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/platform/security" 
                  element={
                    <ProtectedRoute>
                      <PlatformSecurity />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/platform/subscriptions" 
                  element={
                    <ProtectedRoute>
                      <PlatformSubscriptions />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/platform/settings" 
                  element={
                    <ProtectedRoute>
                      <PlatformSettings />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/platform/support" 
                  element={
                    <ProtectedRoute>
                      <PlatformSupport />
                    </ProtectedRoute>
                  } 
                />

                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
