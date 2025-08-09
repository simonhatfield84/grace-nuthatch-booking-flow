
import {
  BarChart3,
  Calendar,
  Coffee,
  FileText,
  Grid3X3,
  Settings,
  Users,
  Wifi,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCurrentUserProfile } from '@/hooks/useUserProfile';
import { Skeleton } from "@/components/ui/skeleton"
import { MoreHorizontal } from "lucide-react"

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  showUserProfile?: boolean;
}

const AdminSidebar = ({ collapsed = false, onToggleCollapse, showUserProfile = true }: AdminSidebarProps) => {
  const location = useLocation();
  const { signOut } = useAuth();
  const { data: profile, isLoading } = useCurrentUserProfile();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarItems = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Host View', href: '/new-host', icon: Calendar },
    { name: 'Tables', href: '/tables', icon: Grid3X3 },
    { name: 'Services', href: '/services', icon: Coffee },
    { name: 'Guests', href: '/guests', icon: Users },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'WiFi Settings', href: '/wifi-settings', icon: Wifi },
  ];

  return (
    <div className={`flex flex-col h-full bg-sidebar-background border-r border-sidebar-border transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="px-4 py-6">
        <a href="/dashboard" className="block">
          {collapsed ? (
            <div className="grace-logo text-2xl text-center">G</div>
          ) : (
            <div className="grace-logo text-2xl">grace</div>
          )}
        </a>
      </div>
      <div className="flex-grow p-4">
        <ul className="space-y-2">
          {sidebarItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center space-x-2 p-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition ${
                    isActive
                      ? 'bg-sidebar-accent font-semibold text-sidebar-primary'
                      : 'text-sidebar-foreground'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      {showUserProfile && (
        <div className="p-4 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
                <div className="flex items-center space-x-2">
                  {isLoading ? (
                    <Skeleton className="h-8 w-8 rounded-full" />
                  ) : (
                    <Avatar>
                      <AvatarImage src="" />
                      <AvatarFallback>{profile?.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  {!collapsed && (
                    <div className="flex flex-col items-start">
                      {isLoading ? (
                        <Skeleton className="h-4 w-24" />
                      ) : (
                        <span className="text-sm font-medium text-sidebar-foreground">{profile?.displayName}</span>
                      )}
                      <span className="text-xs text-sidebar-foreground/70">
                        {profile?.email}
                      </span>
                    </div>
                  )}
                </div>
                {!collapsed && <MoreHorizontal className="w-4 h-4 text-sidebar-foreground/70" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};

export default AdminSidebar;
