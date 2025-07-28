
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
import BookingWidgetPage from "@/pages/BookingWidget";
import NewHostInterface from "@/pages/NewHostInterface";
import NotFound from "@/pages/NotFound";
import CancelBooking from "@/pages/CancelBooking";
import ModifyBooking from "@/pages/ModifyBooking";
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
                <Route path="/booking/nuthatch" element={<BookingWidgetPage />} />
                <Route path="/cancel-booking" element={<CancelBooking />} />
                <Route path="/modify-booking" element={<ModifyBooking />} />
                
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
