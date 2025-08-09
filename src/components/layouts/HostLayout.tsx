
import { useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { HOST_TOKENS } from "@/theme/host-tokens";
import "@/theme/host-theme.css";

interface HostLayoutProps {
  children?: React.ReactNode;
}

export function HostLayout({ children }: HostLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Collapsed by default for iPad

  return (
    <div className="host-app dark flex h-screen text-white" style={{ backgroundColor: HOST_TOKENS.colors.background }}>
      <AdminSidebar 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        showUserProfile={true}
        isHostMode={true}
      />
      <div 
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300`}
        style={{
          marginLeft: sidebarCollapsed ? HOST_TOKENS.layout.sidebarWidth.collapsed : HOST_TOKENS.layout.sidebarWidth.expanded
        }}
      >
        {/* No header - maximizing space for iPad */}
        <main 
          className="flex-1 overflow-auto text-white"
          style={{ 
            padding: HOST_TOKENS.layout.containerPadding,
            backgroundColor: HOST_TOKENS.colors.background,
            color: HOST_TOKENS.colors.text
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
