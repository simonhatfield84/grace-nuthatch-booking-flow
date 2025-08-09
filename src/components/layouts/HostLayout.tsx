
import { useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";

interface HostLayoutProps {
  children?: React.ReactNode;
}

export function HostLayout({ children }: HostLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Collapsed by default for iPad

  return (
    <div className="dark host-app flex h-screen bg-host-blackest-dark text-white">
      <AdminSidebar 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        showUserProfile={true}
        isHostMode={true}
      />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* No header - maximizing space for iPad */}
        <main className="flex-1 overflow-auto p-4 bg-host-blackest-dark text-white">
          {children}
        </main>
      </div>
    </div>
  );
}
