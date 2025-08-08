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
import { useAuth } from '@/hooks/useAuth';
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
import { useUserProfile } from '@/hooks/useUserProfile';
import { Skeleton } from "@/components/ui/skeleton"
import { MoreHorizontal } from "lucide-react"

export const AdminSidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();
  const { data: profile, isLoading } = useUserProfile();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // Adjust the breakpoint as needed
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up event listener on unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarItems = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Host View', href: '/host', icon: Calendar },
    { name: 'Tables', href: '/tables', icon: Grid3X3 },
    { name: 'Services', href: '/services', icon: Coffee },
    { name: 'Guests', href: '/guests', icon: Users },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'WiFi Settings', href: '/wifi-settings', icon: Wifi },
  ];

  return (
    <div className="flex flex-col h-full bg-secondary border-r">
      <div className="px-4 py-6">
        <a href="/dashboard">
          <img src="/logo.svg" alt="Logo" className="h-8" />
        </a>
      </div>
      <div className="flex-grow p-4">
        <ul className="space-y-2">
          {sidebarItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center space-x-2 p-2 rounded-md hover:bg-muted transition ${
                    isActive
                      ? 'bg-muted font-semibold text-primary'
                      : 'text-muted-foreground'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isLoading ? (
                  <Skeleton className="h-8 w-8 rounded-full" />
                ) : (
                  <Avatar>
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback>{profile?.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div className="flex flex-col items-start">
                  {isLoading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : (
                    <span className="text-sm font-medium">{profile?.full_name}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {profile?.email}
                  </span>
                </div>
              </div>
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
