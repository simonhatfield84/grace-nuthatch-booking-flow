
import { Outlet, Navigate } from "react-router-dom";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Building2, Users, CreditCard, Settings, BarChart3, HeadphonesIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const platformNavItems = [
  {
    title: "Dashboard",
    url: "/platform/dashboard",
    icon: BarChart3,
  },
  {
    title: "Venues",
    url: "/platform/venues",
    icon: Building2,
  },
  {
    title: "Users",
    url: "/platform/users",
    icon: Users,
  },
  {
    title: "Subscriptions",
    url: "/platform/subscriptions",
    icon: CreditCard,
  },
  {
    title: "Support",
    url: "/platform/support",
    icon: HeadphonesIcon,
  },
  {
    title: "Settings",
    url: "/platform/settings",
    icon: Settings,
  },
];

export function PlatformAdminLayout() {
  const { data: isPlatformAdmin, isLoading } = usePlatformAdmin();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isPlatformAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50/40">
        <Sidebar variant="inset">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-lg font-semibold px-4 py-2">
                Platform Admin
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {platformNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === item.url}
                      >
                        <Link to={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b bg-white px-6 py-3">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold">Platform Administration</h1>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
