import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Settings, 
  ChefHat,
  BarChart3,
  MapPin,
  UserCheck,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Receipt
} from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChangePasswordDialog } from "@/components/auth/ChangePasswordDialog";
import { HOST_TOKENS } from "@/theme/host-tokens";

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Host Interface', href: '/host', icon: Calendar },
  { name: 'Tables', href: '/tables', icon: MapPin },
  { name: 'Services', href: '/services', icon: ChefHat },
  { name: 'Guests', href: '/guests', icon: UserCheck },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Orders Review', href: '/admin/orders/review', icon: Receipt },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  showUserProfile?: boolean;
  isHostMode?: boolean;
}

const AdminSidebar = ({ collapsed = false, onToggleCollapse, showUserProfile = false, isHostMode = false }: AdminSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Determine if we're in host mode from props or location
  const inHostMode = isHostMode || location.pathname.startsWith('/host');
  
  // Apply host-specific styling using tokens
  const sidebarStyles = inHostMode ? {
    backgroundColor: HOST_TOKENS.colors.sidebar,
    borderColor: HOST_TOKENS.colors.border,
    color: HOST_TOKENS.colors.text
  } : {};

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Failed",
        description: error.message || "An error occurred during logout.",
        variant: "destructive",
      });
    }
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className={`flex items-center justify-between p-3 border-b ${collapsed ? 'px-2' : ''}`}
           style={inHostMode ? { borderColor: HOST_TOKENS.colors.border } : {}}>
        {!collapsed && (
          <div 
            className={`grace-logo text-xl font-bold`}
            style={inHostMode ? { 
              color: HOST_TOKENS.colors.text,
              fontFamily: HOST_TOKENS.typography.fontFamilies.heading 
            } : {}}
          >
            grace
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className={`space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isItemActive = isActive(item.href);
            
            const linkStyles = inHostMode ? {
              color: isItemActive ? HOST_TOKENS.colors.text : HOST_TOKENS.colors.muted,
              backgroundColor: isItemActive ? HOST_TOKENS.colors.card : 'transparent',
            } : {};
            
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-opacity-80 ${collapsed && 'justify-center px-2'}`}
                style={linkStyles}
                title={collapsed ? item.name : undefined}
                onMouseEnter={(e) => {
                  if (inHostMode && !isItemActive) {
                    e.currentTarget.style.backgroundColor = HOST_TOKENS.colors.hover;
                    e.currentTarget.style.color = HOST_TOKENS.colors.text;
                  }
                }}
                onMouseLeave={(e) => {
                  if (inHostMode && !isItemActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = HOST_TOKENS.colors.muted;
                  }
                }}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
                {!collapsed && <span className="flex-1">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User Profile Section - only show if showUserProfile is true */}
      {showUserProfile && (
        <div className={`p-3 border-t ${collapsed ? 'px-2' : ''}`}
             style={inHostMode ? { borderColor: HOST_TOKENS.colors.border } : {}}>
          {collapsed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full h-10 p-0">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className={`text-xs ${inHostMode ? 'bg-host-dark-gray text-white' : ''}`}>
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" side="right">
                <DropdownMenuItem disabled className="font-normal">
                  <User className="mr-2 h-4 w-4" />
                  {user?.email}
                </DropdownMenuItem>
                <ChangePasswordDialog />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="space-y-2">
              <div className={`flex items-center gap-2 p-2 rounded-md ${inHostMode ? 'bg-host-dark-gray' : 'bg-muted'}`}>
                <Avatar className="h-6 w-6">
                  <AvatarFallback className={`text-xs ${inHostMode ? 'bg-host-mid-gray text-white' : ''}`}>
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className={`text-xs truncate flex-1 ${inHostMode ? 'text-white' : ''}`}>{user?.email}</span>
              </div>
              <div className="flex gap-1">
                <ChangePasswordDialog />
                <Button variant="ghost" size="sm" onClick={handleLogout} className={`flex-1 text-xs ${inHostMode ? 'text-white hover:bg-host-dark-gray' : ''}`}>
                  <LogOut className="h-3 w-3 mr-1" />
                  Sign out
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapse Toggle */}
      <div className={`p-3 border-t ${collapsed ? 'px-2' : ''}`}
           style={inHostMode ? { borderColor: HOST_TOKENS.colors.border } : {}}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={`w-full ${collapsed ? 'px-2' : 'justify-start'}`}
          style={inHostMode ? { 
            color: HOST_TOKENS.colors.text,
            backgroundColor: 'transparent'
          } : {}}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onMouseEnter={(e) => {
            if (inHostMode) {
              e.currentTarget.style.backgroundColor = HOST_TOKENS.colors.hover;
            }
          }}
          onMouseLeave={(e) => {
            if (inHostMode) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Collapse
            </>
          )}
        </Button>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className={`p-3 border-t`}
             style={inHostMode ? { borderColor: HOST_TOKENS.colors.border } : {}}>
          <p className={`text-xs`}
             style={inHostMode ? { color: HOST_TOKENS.colors.muted } : {}}>
            Grace OS • Venue Management
          </p>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/20" onClick={() => setIsMobileMenuOpen(false)} />
          <div 
            className={`relative flex w-64 flex-col border-r`}
            style={{
              ...sidebarStyles,
              borderColor: inHostMode ? HOST_TOKENS.colors.border : undefined
            }}
          >
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div 
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 border-r transition-all duration-300 z-30`}
        style={{
          width: collapsed ? HOST_TOKENS.layout.sidebarWidth.collapsed : HOST_TOKENS.layout.sidebarWidth.expanded,
          ...sidebarStyles,
          borderColor: inHostMode ? HOST_TOKENS.colors.border : undefined
        }}
      >
        <SidebarContent />
      </div>
    </>
  );
};

export default AdminSidebar;
