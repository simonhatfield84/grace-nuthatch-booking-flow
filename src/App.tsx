
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
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Get subdomain to determine app mode
const getSubdomain = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // For development (localhost)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'main';
  }
  
  // For production subdomains
  if (parts.length >= 3) {
    return parts[0]; // e.g., 'app' from 'app.grace-os.co.uk'
  }
  
  return 'main'; // Default to main site
};

const App = () => {
  const subdomain = getSubdomain();

  // Host-only interface
  if (subdomain === 'host') {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider defaultTheme="system" storageKey="grace-ui-theme">
            <TooltipProvider>
              <AuthProvider>
                <Toaster />
                <Sonner />
                <ProtectedRoute>
                  <HostInterface />
                </ProtectedRoute>
              </AuthProvider>
            </TooltipProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  // Admin dashboard
  if (subdomain === 'app') {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider defaultTheme="system" storageKey="grace-ui-theme">
            <TooltipProvider>
              <AuthProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  {/* Auth Route */}
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* Admin approval endpoint */}
                  <Route path="/admin/approve" element={
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Processing Approval...</h1>
                        <p>Please wait while we process the venue approval.</p>
                      </div>
                    </div>
                  } />
                  
                  {/* Protected Admin Routes */}
                  <Route path="/*" element={
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
                </Routes>
              </AuthProvider>
            </TooltipProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  // Main marketing site (grace-os.co.uk)
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="system" storageKey="grace-ui-theme">
          <TooltipProvider>
            <AuthProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Marketing homepage */}
                <Route path="/" element={<HomePage />} />
                
                {/* Setup Route */}
                <Route path="/setup" element={<Setup />} />
                
                {/* Auth Route */}
                <Route path="/auth" element={<Auth />} />
                
                {/* Public Booking Widget */}
                <Route path="/widget" element={<BookingWidget />} />
                <Route path="/widget/*" element={<BookingWidget />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
