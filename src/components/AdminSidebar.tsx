
import { Calendar, Users, Utensils, BarChart3, Settings, Home } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/admin/dashboard", icon: BarChart3 },
  { title: "Services", url: "/admin/services", icon: Calendar },
  { title: "Tables", url: "/admin/tables", icon: Utensils },
  { title: "Host Interface", url: "/admin/host", icon: Home },
  { title: "Guests", url: "/admin/guests", icon: Users },
  { title: "Reports", url: "/admin/reports", icon: BarChart3 },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    return currentPath === path || (path !== "/admin/dashboard" && currentPath.startsWith(path));
  };

  const getNavCls = (path: string) =>
    isActive(path) 
      ? "bg-primary/10 text-primary border-r-2 border-primary font-medium" 
      : "hover:bg-accent hover:text-primary transition-colors";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent className="bg-sidebar-background border-r border-sidebar-border">
        <div className="p-4 border-b border-sidebar-border">
          <div className="grace-logo text-2xl font-bold text-center">
            {isCollapsed ? "G" : "grace"}
          </div>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 font-medium px-4 py-2">
            {!isCollapsed && "Venue Management"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className={isCollapsed ? "px-1" : "px-2"}>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className={`rounded-lg mb-1 ${isCollapsed ? 'justify-center px-0' : ''}`}>
                    <NavLink to={item.url} className={getNavCls(item.url)}>
                      <item.icon className={`h-5 w-5 ${isCollapsed ? 'mx-auto' : 'mr-2'}`} strokeWidth={2} />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
