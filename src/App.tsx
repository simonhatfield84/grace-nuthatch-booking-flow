
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import RootRedirect from "@/components/auth/RootRedirect";
import { StripeProvider } from "@/components/providers/StripeProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Setup from "./pages/Setup";
import Dashboard from "./pages/Dashboard";
import NewHostInterface from "./pages/NewHostInterface";
import Services from "./pages/Services";
import Tables from "./pages/Tables";
import Guests from "./pages/Guests";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import WiFi from "./pages/WiFi";
import BookingWidget from "./pages/BookingWidget";
import ModifyBooking from "./pages/ModifyBooking";
import CancelBooking from "./pages/CancelBooking";
import WifiPortal from "./pages/WifiPortal";
import WifiPortalSuccess from "./pages/WifiPortalSuccess";
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";

// Platform admin routes
import PlatformAuth from "./pages/PlatformAuth";
import PlatformDashboard from "./pages/PlatformDashboard";
import PlatformVenues from "./pages/PlatformVenues";
import PlatformUsers from "./pages/PlatformUsers";
import PlatformSettings from "./pages/PlatformSettings";
import PlatformSecurity from "./pages/PlatformSecurity";
import PlatformSubscriptions from "./pages/PlatformSubscriptions";
import PlatformSupport from "./pages/PlatformSupport";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StripeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <ErrorBoundary>
                <Routes>
                  {/* Public routes */}
                  <Route path="/homepage" element={<HomePage />} />
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* WiFi Portal routes - public access */}
                  <Route path="/wifiportal/nuthatch" element={<WifiPortal />} />
                  <Route path="/wifiportal/success/nuthatch" element={<WifiPortalSuccess />} />
                  
                  {/* Booking widget - public, static route for single venue */}
                  <Route path="/booking" element={<BookingWidget />} />
                  <Route path="/modify/:token" element={<ModifyBooking />} />
                  <Route path="/cancel/:token" element={<CancelBooking />} />

                  {/* Platform admin routes */}
                  <Route path="/platform/auth" element={<PlatformAuth />} />
                  <Route path="/platform/dashboard" element={<ProtectedRoute><PlatformDashboard /></ProtectedRoute>} />
                  <Route path="/platform/venues" element={<ProtectedRoute><PlatformVenues /></ProtectedRoute>} />
                  <Route path="/platform/users" element={<ProtectedRoute><PlatformUsers /></ProtectedRoute>} />
                  <Route path="/platform/settings" element={<ProtectedRoute><PlatformSettings /></ProtectedRoute>} />
                  <Route path="/platform/security" element={<ProtectedRoute><PlatformSecurity /></ProtectedRoute>} />
                  <Route path="/platform/subscriptions" element={<ProtectedRoute><PlatformSubscriptions /></ProtectedRoute>} />
                  <Route path="/platform/support" element={<ProtectedRoute><PlatformSupport /></ProtectedRoute>} />

                  {/* Protected routes */}
                  <Route path="/" element={<RootRedirect />} />
                  <Route path="/setup" element={<Setup />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/host" element={<ProtectedRoute><NewHostInterface /></ProtectedRoute>} />
                  <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
                  <Route path="/tables" element={<ProtectedRoute><Tables /></ProtectedRoute>} />
                  <Route path="/guests" element={<ProtectedRoute><Guests /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                  <Route path="/wifi" element={<ProtectedRoute><WiFi /></ProtectedRoute>} />
                  
                  {/* 404 page */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </StripeProvider>
    </QueryClientProvider>
  );
}

export default App;
