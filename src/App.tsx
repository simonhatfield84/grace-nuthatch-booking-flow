
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { ThemeProvider } from "@/components/theme-provider";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import Tables from "./pages/Tables";
import Guests from "./pages/Guests";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import HostInterface from "./pages/HostInterface";
import BookingWidget from "./pages/BookingWidget";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="grace-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Booking Widget */}
            <Route path="/widget" element={<BookingWidget />} />
            <Route path="/widget/*" element={<BookingWidget />} />
            
            {/* Host Interface */}
            <Route path="/host" element={<HostInterface />} />
            
            {/* Admin Area */}
            <Route path="/" element={
              <SidebarProvider>
                <div className="min-h-screen flex w-full">
                  <AdminLayout />
                </div>
              </SidebarProvider>
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
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
