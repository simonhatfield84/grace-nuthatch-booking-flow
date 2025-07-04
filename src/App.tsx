
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import Tables from "./pages/Tables";
import Guests from "./pages/Guests";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import HostInterface from "./pages/HostInterface";
import BookingWidget from "./pages/BookingWidget";
import Setup from "./pages/Setup";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" storageKey="grace-ui-theme">
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Setup Route */}
              <Route path="/setup" element={<Setup />} />
              
              {/* Auth Route */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Public Booking Widget */}
              <Route path="/widget" element={<BookingWidget />} />
              <Route path="/widget/*" element={<BookingWidget />} />
              
              {/* Host Interface - Protected */}
              <Route path="/host" element={
                <ProtectedRoute>
                  <HostInterface />
                </ProtectedRoute>
              } />
              
              {/* Admin Area - Protected */}
              <Route path="/" element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <AdminLayout />
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="services" element={<Services />} />
                <Route path="tables" element={<Tables />} />
                <Route path="guests" element={<Guests />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
