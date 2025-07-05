
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Setup from "./pages/Setup";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Tables from "./pages/Tables";
import HostInterface from "./pages/HostInterface";
import Guests from "./pages/Guests";
import BookingWidget from "./pages/BookingWidget";
import Services from "./pages/Services";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import HomePage from "./pages/HomePage";
import { PlatformAdminLayout } from "./components/layouts/PlatformAdminLayout";
import PlatformAuth from "./pages/PlatformAuth";
import PlatformDashboard from "./pages/PlatformDashboard";
import PlatformVenues from "./pages/PlatformVenues";
import PlatformUsers from "./pages/PlatformUsers";
import PlatformSubscriptions from "./pages/PlatformSubscriptions";
import PlatformSupport from "./pages/PlatformSupport";
import PlatformSettings from "./pages/PlatformSettings";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/setup" element={<Setup />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/booking/:slug" element={<BookingWidget />} />
                <Route path="/booking/:slug/:secretSlug" element={<BookingWidget />} />
                
                {/* Protected venue admin routes */}
                <Route path="/admin" element={<ProtectedRoute><></></ProtectedRoute>}>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="tables" element={<Tables />} />
                  <Route path="host" element={<HostInterface />} />
                  <Route path="guests" element={<Guests />} />
                  <Route path="services" element={<Services />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="reports" element={<Reports />} />
                </Route>

                {/* Platform admin auth route */}
                <Route path="/platform/auth" element={<PlatformAuth />} />

                {/* Platform admin routes */}
                <Route path="/platform" element={<PlatformAdminLayout />}>
                  <Route path="dashboard" element={<PlatformDashboard />} />
                  <Route path="venues" element={<PlatformVenues />} />
                  <Route path="users" element={<PlatformUsers />} />
                  <Route path="subscriptions" element={<PlatformSubscriptions />} />
                  <Route path="support" element={<PlatformSupport />} />
                  <Route path="settings" element={<PlatformSettings />} />
                </Route>

                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
