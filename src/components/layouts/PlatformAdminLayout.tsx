
import { Outlet, Navigate } from "react-router-dom";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Building2, Users, CreditCard, Settings, BarChart3, HeadphonesIcon, Shield } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { PlatformHeader } from "@/components/platform/PlatformHeader";

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
    title: "Security",
    url: "/platform/security",
    icon: Shield,
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
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isPlatformAdmin) {
    return <Navigate to="/platform/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50/40">
        <Sidebar variant="inset" className="bg-slate-800 border-slate-700">
          <SidebarContent className="bg-slate-800">
            <SidebarGroup>
              <SidebarGroupLabel className="text-lg font-semibold px-4 py-2 text-slate-100">
                Platform Admin
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {platformNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === item.url}
                        className="text-slate-100 hover:text-white hover:bg-slate-700 data-[active=true]:bg-orange-600 data-[active=true]:text-white"
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
          <header className="border-b bg-slate-800 border-slate-700 px-6 py-3">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-slate-100 hover:text-white" />
              <h1 className="text-xl font-semibold text-white">Platform Administration</h1>
              <PlatformHeader />
            </div>
          </header>
          <div className="flex-1 overflow-auto p-6 bg-slate-50">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
