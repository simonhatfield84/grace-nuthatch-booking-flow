import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import BookingWidget from "./pages/BookingWidget";
import BookingLegacyBySlug from "./pages/BookingLegacyBySlug";
import ModifyBooking from "./pages/ModifyBooking";
import CancelBooking from "./pages/CancelBooking";
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
import PlatformStyleExportPreview from "./pages/PlatformStyleExportPreview";
import PlatformRefactorStatus from "./pages/PlatformRefactorStatus";
import OrdersReview from "./pages/admin/OrdersReview";

const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* All routes - full provider stack but selective Stripe usage */}
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
                      <PaymentPage />
                    } />
                    <Route path="/payment-success" element={<PaymentSuccess />} />
                    
                    {/* Legacy booking widget - slug-based (NEW) */}
                    <Route path="/booking/:venueSlug" element={<BookingLegacyBySlug />} />
                    
                    {/* Legacy booking widget - redirect for backward compatibility */}
                    <Route path="/booking" element={<Navigate to="/booking/the-nuthatch" replace />} />
                    
                    {/* Modify/Cancel routes */}
                    <Route path="/modify/:token" element={
                      <StripeProvider>
                        <ModifyBooking />
                      </StripeProvider>
                    } />
                    <Route path="/cancel/:token" element={
                      <StripeProvider>
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
                      <Route path="style-export-preview" element={<PlatformStyleExportPreview />} />
                      <Route path="refactor-status" element={<PlatformRefactorStatus />} />
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
                    <Route path="/admin/orders/review" element={
                      <ProtectedRoute>
                        <AdminLayout>
                          <OrdersReview />
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
