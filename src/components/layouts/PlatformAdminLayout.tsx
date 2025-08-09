
import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";
import { 
  BarChart3, 
  Users, 
  Building2, 
  Settings, 
  Shield, 
  CreditCard, 
  HelpCircle, 
  LogOut,
  Menu,
  X,
  FileText
} from "lucide-react";

export const PlatformAdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data: isPlatformAdmin, isLoading } = usePlatformAdmin();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/platform/auth');
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isPlatformAdmin) {
    navigate('/platform/auth');
    return null;
  }

  const menuItems = [
    { icon: BarChart3, label: "Dashboard", path: "/platform/dashboard" },
    { icon: Building2, label: "Venues", path: "/platform/venues" },
    { icon: Users, label: "Users", path: "/platform/users" },
    { icon: FileText, label: "Reports", path: "/platform/reports" },
    { icon: Shield, label: "Security", path: "/platform/security" },
    { icon: CreditCard, label: "Subscriptions", path: "/platform/subscriptions" },
    { icon: Settings, label: "Settings", path: "/platform/settings" },
    { icon: HelpCircle, label: "Support", path: "/platform/support" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className={`bg-card border-r transition-all duration-300 flex flex-col ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-primary">Grace Platform</h1>
              <p className="text-sm text-muted-foreground">Admin Dashboard</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2"
          >
            {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>

        {/* User Info */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <Badge variant="secondary" className="text-xs">Platform Admin</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sign Out Button */}
        <div className="p-4 border-t">
          <Button
            variant="outline"
            className={`w-full gap-3 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};
