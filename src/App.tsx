import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { QueryClient } from './contexts/QueryContext';
import Dashboard from './pages/Dashboard';
import Guests from './pages/Guests';
import Tables from './pages/Tables';
import Bookings from './pages/Bookings';
import Settings from './pages/Settings';
import Integrations from './pages/Integrations';
import Platform from './pages/Platform';
import { Toaster } from "@/components/ui/toaster"
import WifiPortal from "@/pages/WifiPortal";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <QueryClient>
          <div className="min-h-screen bg-background text-foreground">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/guests" element={<Guests />} />
              <Route path="/tables" element={<Tables />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/integrations" element={<Integrations />} />
              
              {/* Platform Routes - Admin only */}
              <Route path="/platform" element={<Platform />} />
              
              {/* WiFi Portal Route - Public access */}
              <Route path="/wifi-portal/:slug" element={<WifiPortal />} />
            </Routes>
            <Toaster />
          </div>
        </QueryClient>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
