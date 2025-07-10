
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeHandler } from "@/components/ThemeHandler";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { HostLayout } from "@/components/layouts/HostLayout";
import { PlatformAdminLayout } from "@/components/layouts/PlatformAdminLayout";
import HomePage from "./pages/HomePage";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import BookingWidget from "./pages/BookingWidget";
import HostInterface from "./pages/HostInterface";
import NewHostInterface from "./pages/NewHostInterface";
import Setup from "./pages/Setup";
import Settings from "./pages/Settings";
import Tables from "./pages/Tables";
import Services from "./pages/Services";
import Guests from "./pages/Guests";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import PlatformAuth from "./pages/PlatformAuth";
import PlatformDashboard from "./pages/PlatformDashboard";
import PlatformSettings from "./pages/PlatformSettings";
import PlatformUsers from "./pages/PlatformUsers";
import PlatformVenues from "./pages/PlatformVenues";
import PlatformSubscriptions from "./pages/PlatformSubscriptions";
import PlatformSupport from "./pages/PlatformSupport";
import PlatformSecurity from "./pages/PlatformSecurity";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import RootRedirect from "./components/auth/RootRedirect";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="grace-ui-theme">
        <TooltipProvider>
          <AuthProvider>
            <BrowserRouter>
              <ThemeHandler />
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/setup" element={<Setup />} />
                <Route path="/booking/:slug" element={<BookingWidget />} />
                
                {/* Protected Admin Routes - wrapped in AdminLayout */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <Dashboard />
                    </AdminLayout>
                  </ProtectedRoute>
                } />
                <Route path="/host" element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <HostInterface />
                    </AdminLayout>
                  </ProtectedRoute>
                } />
                <Route path="/host-new" element={
                  <ProtectedRoute>
                    <HostLayout>
                      <NewHostInterface />
                    </HostLayout>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <Settings />
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
                <Route path="/services" element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <Services />
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
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <Reports />
                    </AdminLayout>
                  </ProtectedRoute>
                } />
                
                {/* Platform Admin Routes */}
                <Route path="/platform/auth" element={<PlatformAuth />} />
                <Route path="/platform/dashboard" element={
                  <ProtectedRoute>
                    <PlatformAdminLayout>
                      <PlatformDashboard />
                    </PlatformAdminLayout>
                  </ProtectedRoute>
                } />
                <Route path="/platform/settings" element={
                  <ProtectedRoute>
                    <PlatformAdminLayout>
                      <PlatformSettings />
                    </PlatformAdminLayout>
                  </ProtectedRoute>
                } />
                <Route path="/platform/users" element={
                  <ProtectedRoute>
                    <PlatformAdminLayout>
                      <PlatformUsers />
                    </PlatformAdminLayout>
                  </ProtectedRoute>
                } />
                <Route path="/platform/venues" element={
                  <ProtectedRoute>
                    <PlatformAdminLayout>
                      <PlatformVenues />
                    </PlatformAdminLayout>
                  </ProtectedRoute>
                } />
                <Route path="/platform/security" element={
                  <ProtectedRoute>
                    <PlatformAdminLayout>
                      <PlatformSecurity />
                    </PlatformAdminLayout>
                  </ProtectedRoute>
                } />
                <Route path="/platform/subscriptions" element={
                  <ProtectedRoute>
                    <PlatformAdminLayout>
                      <PlatformSubscriptions />
                    </PlatformAdminLayout>
                  </ProtectedRoute>
                } />
                <Route path="/platform/support" element={
                  <ProtectedRoute>
                    <PlatformAdminLayout>
                      <PlatformSupport />
                    </PlatformAdminLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <Toaster />
            <Sonner />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
