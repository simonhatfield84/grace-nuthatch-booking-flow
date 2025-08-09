
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Auth from './pages/Auth';
import PlatformAuth from './pages/PlatformAuth';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import Tables from './pages/Tables';
import Services from './pages/Services';
import Guests from './pages/Guests';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import { BookingWidget } from './features/booking/components/BookingWidget';
import ModifyBooking from './pages/ModifyBooking';
import CancelBooking from './pages/CancelBooking';
import HomePage from './pages/HomePage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SetupGuard } from './components/SetupGuard';
import { AdminLayout } from './components/layouts/AdminLayout';
import { PlatformAdminLayout } from './components/layouts/PlatformAdminLayout';
import PlatformDashboard from './pages/PlatformDashboard';
import PlatformUsers from './pages/PlatformUsers';
import PlatformVenues from './pages/PlatformVenues';
import PlatformSubscriptions from './pages/PlatformSubscriptions';
import PlatformSettings from './pages/PlatformSettings';
import PlatformSecurity from './pages/PlatformSecurity';
import PlatformSupport from './pages/PlatformSupport';
import { HostLayout } from './components/layouts/HostLayout';
import HostInterface from './pages/HostInterface';
import NewHostInterface from './pages/NewHostInterface';
import WifiPortal from './pages/WifiPortal';
import WifiSettings from './pages/WifiSettings';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
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
            <Route path="/booking/the-nuthatch" element={<BookingWidget venueSlug="the-nuthatch" />} />
            <Route path="/booking/the-nuthatch/:serviceSlug" element={<BookingWidget venueSlug="the-nuthatch" />} />
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
              path="/platform"
              element={
                <ProtectedRoute>
                  <PlatformAdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<PlatformDashboard />} />
              <Route path="users" element={<PlatformUsers />} />
              <Route path="venues" element={<PlatformVenues />} />
              <Route path="subscriptions" element={<PlatformSubscriptions />} />
              <Route path="settings" element={<PlatformSettings />} />
              <Route path="security" element={<PlatformSecurity />} />
              <Route path="support" element={<PlatformSupport />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </div>
    </AuthProvider>
  );
}

export default App;
