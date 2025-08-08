
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";

import HomePage from "@/pages/HomePage";
import Auth from "@/pages/Auth";
import PlatformAuth from "@/pages/PlatformAuth";
import Setup from "@/pages/Setup";
import Dashboard from "@/pages/Dashboard";
import PlatformDashboard from "@/pages/PlatformDashboard";
import PlatformUsers from "@/pages/PlatformUsers";
import PlatformVenues from "@/pages/PlatformVenues";
import PlatformSubscriptions from "@/pages/PlatformSubscriptions";
import PlatformSupport from "@/pages/PlatformSupport";
import PlatformSecurity from "@/pages/PlatformSecurity";
import PlatformSettings from "@/pages/PlatformSettings";
import NotFound from "@/pages/NotFound";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ThemeHandler } from "@/components/ThemeHandler";
import { BounceTracker } from "@/components/homepage/BounceTracker";
import Guests from "@/pages/Guests";
import Services from "@/pages/Services";
import Tables from "@/pages/Tables";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import NewHostInterface from "@/pages/NewHostInterface";
import BookingWidget from "@/pages/BookingWidget";
import ModifyBooking from "@/pages/ModifyBooking";
import CancelBooking from "@/pages/CancelBooking";
import WifiPortal from "@/pages/WifiPortal";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { HostLayout } from "@/components/layouts/HostLayout";

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <Router>
            <div className="min-h-screen bg-background">
              <ThemeHandler />
              <BounceTracker />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/platform-auth" element={<PlatformAuth />} />
                <Route path="/setup" element={<Setup />} />
                
                {/* Booking routes - hardcoded for The Nuthatch */}
                <Route path="/booking/nuthatch" element={<BookingWidget />} />
                <Route path="/booking/nuthatch/:serviceSlug" element={<BookingWidget />} />
                <Route path="/booking/:bookingReference" element={<ModifyBooking />} />
                <Route path="/cancel/:bookingReference" element={<CancelBooking />} />
                
                {/* WiFi Portal route - hardcoded for The Nuthatch */}
                <Route path="/wifi-portal/nuthatch" element={<WifiPortal />} />

                {/* Protected venue admin routes - wrapped with AdminLayout */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <AdminLayout>
                        <Dashboard />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/guests"
                  element={
                    <ProtectedRoute>
                      <AdminLayout>
                        <Guests />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/services"
                  element={
                    <ProtectedRoute>
                      <AdminLayout>
                        <Services />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tables"
                  element={
                    <ProtectedRoute>
                      <AdminLayout>
                        <Tables />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute>
                      <AdminLayout>
                        <Reports />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <AdminLayout>
                        <Settings />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Host Interface - uses specialized HostLayout for iPad optimization */}
                <Route
                  path="/host"
                  element={
                    <ProtectedRoute>
                      <HostLayout>
                        <NewHostInterface />
                      </HostLayout>
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
                  path="/platform/users"
                  element={
                    <ProtectedRoute>
                      <PlatformUsers />
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
                  path="/platform/subscriptions"
                  element={
                    <ProtectedRoute>
                      <PlatformSubscriptions />
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
                <Route
                  path="/platform/security"
                  element={
                    <ProtectedRoute>
                      <PlatformSecurity />
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

                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
