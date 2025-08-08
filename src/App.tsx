import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { Auth } from './pages/Auth';
import { PlatformAuth } from './pages/PlatformAuth';
import { Setup } from './pages/Setup';
import { Dashboard } from './pages/Dashboard';
import { Tables } from './pages/Tables';
import { Services } from './pages/Services';
import { Guests } from './pages/Guests';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';
import { BookingWidget } from './components/booking/BookingWidget';
import { ModifyBooking } from './pages/booking/ModifyBooking';
import { CancelBooking } from './pages/booking/CancelBooking';
import { HomePage } from './pages/HomePage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SetupGuard } from './components/SetupGuard';
import { AdminLayout } from './components/AdminLayout';
import { PlatformAdminLayout } from './components/platform/PlatformAdminLayout';
import { PlatformDashboard } from './pages/platform/PlatformDashboard';
import { PlatformUsers } from './pages/platform/PlatformUsers';
import { PlatformVenues } from './pages/platform/PlatformVenues';
import { PlatformSubscriptions } from './pages/platform/PlatformSubscriptions';
import { PlatformSettings } from './pages/platform/PlatformSettings';
import { PlatformSecurity } from './pages/platform/PlatformSecurity';
import { PlatformSupport } from './pages/platform/PlatformSupport';
import { HostLayout } from './components/HostLayout';
import { HostInterface } from './pages/HostInterface';
import { NewHostInterface } from './pages/NewHostInterface';
import { WifiPortal } from './pages/WifiPortal';
import WifiSettings from "@/pages/WifiSettings";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Router>
        <Routes>
          {/* Public routes */}
          <Route 
            path="/" 
            element={<HomePage />} 
          />
          <Route path="/auth" element={<Auth />} />
          <Route path="/platform-auth" element={<PlatformAuth />} />
          
          {/* Setup route - check if setup is complete first */}
          <Route 
            path="/setup" 
            element={
              <SetupGuard>
                <Setup />
              </SetupGuard>
            } 
          />
          
          {/* Booking routes - hardcoded for The Nuthatch */}
          <Route path="/booking/the-nuthatch" element={<BookingWidget />} />
          <Route path="/booking/the-nuthatch/:serviceSlug" element={<BookingWidget />} />
          <Route path="/booking/:bookingReference" element={<ModifyBooking />} />
          <Route path="/cancel/:bookingReference" element={<CancelBooking />} />
          
          {/* WiFi Portal route - hardcoded for The Nuthatch */}
          <Route path="/wifi-portal/the-nuthatch" element={<WifiPortal />} />

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
            path="/host"
            element={
              <ProtectedRoute>
                <HostLayout>
                  <HostInterface />
                </HostLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/new-host"
            element={
              <ProtectedRoute>
                <HostLayout>
                  <NewHostInterface />
                </HostLayout>
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
          <Route
            path="/wifi-settings"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <WifiSettings />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Platform admin routes */}
          <Route
            path="/platform/*"
            element={
              <ProtectedRoute requirePlatformAdmin={true}>
                <PlatformAdminLayout>
                  <Routes>
                    <Route path="dashboard" element={<PlatformDashboard />} />
                    <Route path="users" element={<PlatformUsers />} />
                    <Route path="venues" element={<PlatformVenues />} />
                    <Route path="subscriptions" element={<PlatformSubscriptions />} />
                    <Route path="settings" element={<PlatformSettings />} />
                    <Route path="security" element={<PlatformSecurity />} />
                    <Route path="support" element={<PlatformSupport />} />
                  </Routes>
                </PlatformAdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </div>
  );
}

function SetupGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  // Check if the current path is /setup
  const isSetupPath = location.pathname === '/setup';

  // If we're already on the /setup page, just render the children
  if (isSetupPath) {
    return <>{children}</>;
  }

  // If we're not on the /setup page, redirect to it
  return (
    <ProtectedRoute redirectTo="/setup">
      {children}
    </ProtectedRoute>
  );
}

export default App;
