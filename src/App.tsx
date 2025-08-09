
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
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { PlatformAdminLayout } from "@/components/layouts/PlatformAdminLayout";
import { HostLayout } from "@/components/layouts/HostLayout";
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
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccess from "./pages/PaymentSuccess";

// Platform admin routes
import PlatformAuth from "./pages/PlatformAuth";
import PlatformDashboard from "./pages/PlatformDashboard";
import PlatformVenues from "./pages/PlatformVenues";
import PlatformUsers from "./pages/PlatformUsers";
import PlatformReports from "./pages/PlatformReports";
import PlatformSettings from "./pages/PlatformSettings";
import PlatformSecurity from "./pages/PlatformSecurity";
import PlatformSubscriptions from "./pages/PlatformSubscriptions";
import PlatformSupport from "./pages/PlatformSupport";

const queryClient = new QueryClient();

// Minimal layout for public WiFi routes that don't need Auth or Stripe
function WifiPublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* WiFi Portal routes - minimal providers, no auth needed */}
        <Route path="/wifiportal/nuthatch" element={
          <WifiPublicLayout>
            <WifiPortal />
          </WifiPublicLayout>
        } />
        <Route path="/wifiportal/success/nuthatch" element={
          <WifiPublicLayout>
            <WifiPortalSuccess />
          </WifiPublicLayout>
        } />
        
        {/* All other routes - full provider stack but selective Stripe usage */}
        <Route path="/*" element={
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <AuthProvider>
                <ErrorBoundary>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/homepage" element={<HomePage />} />
                    <Route path="/auth" element={<Auth />} />
                    
                    {/* Payment routes - public, needs Stripe */}
                    <Route path="/payment/:paymentIntentId" element={
                      <StripeProvider usePublicMode={true}>
                        <PaymentPage />
                      </StripeProvider>
                    } />
                    <Route path="/payment-success" element={<PaymentSuccess />} />
                    
                    {/* Booking widget - public, needs Stripe with public mode - using clean BookingFlowManager */}
                    <Route path="/booking" element={
                      <StripeProvider usePublicMode={true} venueSlug="the-nuthatch">
                        <BookingWidget />
                      </StripeProvider>
                    } />
                    <Route path="/modify/:token" element={
                      <StripeProvider usePublicMode={true} venueSlug="the-nuthatch">
                        <ModifyBooking />
                      </StripeProvider>
                    } />
                    <Route path="/cancel/:token" element={
                      <StripeProvider usePublicMode={true} venueSlug="the-nuthatch">
                        <CancelBooking />
                      </StripeProvider>
                    } />

                    {/* Platform admin routes */}
                    <Route path="/platform/auth" element={<PlatformAuth />} />
                    <Route path="/platform/*" element={
                      <ProtectedRoute>
                        <PlatformAdminLayout />
                      </ProtectedRoute>
                    }>
                      <Route path="dashboard" element={<PlatformDashboard />} />
                      <Route path="venues" element={<PlatformVenues />} />
                      <Route path="users" element={<PlatformUsers />} />
                      <Route path="reports" element={<PlatformReports />} />
                      <Route path="settings" element={<PlatformSettings />} />
                      <Route path="security" element={<PlatformSecurity />} />
                      <Route path="subscriptions" element={<PlatformSubscriptions />} />
                      <Route path="support" element={<PlatformSupport />} />
                    </Route>

                    {/* Admin routes with AdminLayout - NO STRIPE PROVIDER */}
                    <Route path="/" element={<RootRedirect />} />
                    <Route path="/setup" element={<Setup />} />
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <AdminLayout>
                          <Dashboard />
                        </AdminLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/host" element={
                      <ProtectedRoute>
                        <HostLayout>
                          <NewHostInterface />
                        </HostLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/services" element={
                      <ProtectedRoute>
                        <AdminLayout>
                          <Services />
                        </AdminLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/tables" element={
                      <ProtectedRoute>
                        <AdminLayout>
                          <Tables />
                        </AdminLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/guests" element={
                      <ProtectedRoute>
                        <AdminLayout>
                          <Guests />
                        </AdminLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/settings" element={
                      <ProtectedRoute>
                        <AdminLayout>
                          <Settings />
                        </AdminLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/reports" element={
                      <ProtectedRoute>
                        <AdminLayout>
                          <Reports />
                        </AdminLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/wifi" element={
                      <ProtectedRoute>
                        <AdminLayout>
                          <WiFi />
                        </AdminLayout>
                      </ProtectedRoute>
                    } />
                    
                    {/* 404 page */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ErrorBoundary>
              </AuthProvider>
            </TooltipProvider>
          </QueryClientProvider>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
