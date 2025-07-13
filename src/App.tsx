
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import RootRedirect from "@/components/auth/RootRedirect";
import HomePage from "@/pages/HomePage";
import Dashboard from "@/pages/Dashboard";
import Tables from "@/pages/Tables";
import Settings from "@/pages/Settings";
import Guests from "@/pages/Guests";
import Services from "@/pages/Services";
import Reports from "@/pages/Reports";
import Auth from "@/pages/Auth";
import Setup from "@/pages/Setup";
import BookingWidget from "@/pages/BookingWidget";
import NewHostInterface from "@/pages/NewHostInterface";
import NotFound from "@/pages/NotFound";
import PlatformAuth from "@/pages/PlatformAuth";
import PlatformDashboard from "@/pages/PlatformDashboard";
import PlatformSettings from "@/pages/PlatformSettings";
import PlatformUsers from "@/pages/PlatformUsers";
import PlatformVenues from "@/pages/PlatformVenues";
import PlatformSecurity from "@/pages/PlatformSecurity";
import PlatformSubscriptions from "@/pages/PlatformSubscriptions";
import PlatformSupport from "@/pages/PlatformSupport";
import { PlatformAdminLayout } from "@/components/layouts/PlatformAdminLayout";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { ThemeHandler } from "@/components/ThemeHandler";

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
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <AuthProvider>
          <Router>
            <ThemeHandler />
            <div className="min-h-screen bg-background text-foreground">
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/setup" element={<Setup />} />
                <Route path="/booking/:venueSlug" element={<BookingWidget />} />
                
                {/* Protected venue routes with AdminLayout */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <Dashboard />
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
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <Settings />
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
                <Route path="/services" element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <Services />
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
                <Route path="/host" element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <NewHostInterface />
                    </AdminLayout>
                  </ProtectedRoute>
                } />
                
                {/* Platform Admin Routes */}
                <Route path="/platform/auth" element={<PlatformAuth />} />
                <Route path="/platform" element={
                  <ProtectedRoute>
                    <PlatformAdminLayout />
                  </ProtectedRoute>
                }>
                  <Route path="dashboard" element={<PlatformDashboard />} />
                  <Route path="settings" element={<PlatformSettings />} />
                  <Route path="users" element={<PlatformUsers />} />
                  <Route path="venues" element={<PlatformVenues />} />
                  <Route path="security" element={<PlatformSecurity />} />
                  <Route path="subscriptions" element={<PlatformSubscriptions />} />
                  <Route path="support" element={<PlatformSupport />} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Toaster />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
