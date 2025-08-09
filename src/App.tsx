import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeHandler } from "@/components/ThemeHandler";
import { AuthProvider } from "@/contexts/AuthContext";
import { StripeProvider } from "@/components/providers/StripeProvider";
import { InitializeDomainSettings } from "@/components/platform/InitializeDomainSettings";

// Import all pages
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Tables from "./pages/Tables";
import Services from "./pages/Services";
import Guests from "./pages/Guests";
import Reports from "./pages/Reports";
import NewHostInterface from "./pages/NewHostInterface";
import BookingWidget from "./pages/BookingWidget";
import ModifyBooking from "./pages/ModifyBooking";
import CancelBooking from "./pages/CancelBooking";
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import Setup from "./pages/Setup";
import WiFi from "./pages/WiFi";
import WifiPortal from "./pages/WifiPortal";
import WifiPortalSuccess from "./pages/WifiPortalSuccess";
import NotFound from "./pages/NotFound";
import HomePage from "./pages/HomePage";
import HostStylePreview from "./pages/HostStylePreview";

// Platform admin pages
import PlatformAuth from "./pages/PlatformAuth";
import PlatformDashboard from "./pages/PlatformDashboard";
import PlatformVenues from "./pages/PlatformVenues";
import PlatformUsers from "./pages/PlatformUsers";
import PlatformSettings from "./pages/PlatformSettings";
import PlatformReports from "./pages/PlatformReports";
import PlatformSupport from "./pages/PlatformSupport";
import PlatformSecurity from "./pages/PlatformSecurity";
import PlatformSubscriptions from "./pages/PlatformSubscriptions";

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              <BrowserRouter>
                <AuthProvider>
                  <InitializeDomainSettings />
                  <ThemeHandler />
                  <div className="min-h-screen bg-background font-sans antialiased">
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<HomePage />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/platform/auth" element={<PlatformAuth />} />
                      
                      {/* Setup route */}
                      <Route path="/setup" element={<Setup />} />
                      
                      {/* Host style preview - doesn't require auth */}
                      <Route path="/host-preview" element={<HostStylePreview />} />
                      
                      {/* Public WiFi portal routes */}
                      <Route path="/wifi/:venueSlug" element={<WifiPortal />} />
                      <Route path="/wifi-success" element={<WifiPortalSuccess />} />
                      
                      {/* Booking widget routes - public but needs Stripe */}
                      <StripeProvider>
                        <Route path="/book/:venueSlug" element={<BookingWidget />} />
                        <Route path="/book/:venueSlug/:serviceSlug" element={<BookingWidget />} />
                      </StripeProvider>
                      
                      {/* Public booking management routes */}
                      <Route path="/modify/:token" element={<ModifyBooking />} />
                      <Route path="/cancel/:token" element={<CancelBooking />} />
                      
                      {/* Payment routes - public, needs Stripe */}
                      <Route path="/payment/:paymentIntentId" element={
                        <StripeProvider usePublicMode={true}>
                          <PaymentPage />
                        </StripeProvider>
                      } />
                      <Route path="/payment-success" element={<PaymentSuccess />} />
                      
                      {/* Admin/authenticated routes */}
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/tables" element={<Tables />} />
                      <Route path="/services" element={<Services />} />
                      <Route path="/guests" element={<Guests />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/host" element={<NewHostInterface />} />
                      <Route path="/wifi" element={<WiFi />} />
                      
                      {/* Platform admin routes */}
                      <Route path="/platform" element={<PlatformDashboard />} />
                      <Route path="/platform/venues" element={<PlatformVenues />} />
                      <Route path="/platform/users" element={<PlatformUsers />} />
                      <Route path="/platform/settings" element={<PlatformSettings />} />
                      <Route path="/platform/reports" element={<PlatformReports />} />
                      <Route path="/platform/support" element={<PlatformSupport />} />
                      <Route path="/platform/security" element={<PlatformSecurity />} />
                      <Route path="/platform/subscriptions" element={<PlatformSubscriptions />} />
                      
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                  <Toaster />
                  <Sonner />
                </AuthProvider>
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
