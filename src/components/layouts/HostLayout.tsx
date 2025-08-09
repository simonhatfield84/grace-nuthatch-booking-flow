
import { useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { usePaymentFailsafes } from '@/hooks/usePaymentFailsafes';

interface HostLayoutProps {
  children?: React.ReactNode;
}

export const HostLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Collapsed by default for iPad

  // Add payment failsafes
  usePaymentFailsafes();

  return (
    <div className="flex h-screen bg-background text-foreground">
      <AdminSidebar 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <main className="flex-1 overflow-auto p-4 bg-background text-foreground">
          {children}
        </main>
      </div>
    </div>
  );
}
