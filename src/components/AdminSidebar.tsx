
import { Calendar, Users, Utensils, BarChart3, Settings } from "lucide-react";
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
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Services", url: "/services", icon: Calendar },
  { title: "Tables", url: "/tables", icon: Utensils },
  { title: "Guests", url: "/guests", icon: Users },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
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
            Admin Console
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="rounded-lg mb-1">
                    <NavLink to={item.url} className={getNavCls(item.url)}>
                      <item.icon className="h-5 w-5" strokeWidth={2} />
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
