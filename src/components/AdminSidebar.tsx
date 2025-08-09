
import {
  BarChart3,
  Calendar,
  Coffee,
  FileText,
  Grid3X3,
  Settings,
  Users,
  Wifi,
  Menu,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const AdminSidebar = ({ collapsed = false, onToggleCollapse }: AdminSidebarProps) => {
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
    <div className={`fixed left-0 top-0 h-full bg-sidebar-background border-r border-sidebar-border transition-all duration-300 z-10 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex items-center justify-between px-4 py-6">
        <a href="/dashboard" className="block">
          {collapsed ? (
            <div className="grace-logo text-2xl text-center">G</div>
          ) : (
            <div className="grace-logo text-2xl">grace</div>
          )}
        </a>
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="p-1"
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        )}
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
    </div>
  );
};

export default AdminSidebar;
