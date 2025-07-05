
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";

export function PlatformHeader() {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="ml-auto flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-slate-300">System Online</span>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 text-slate-100 hover:text-white hover:bg-slate-700"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">
              Welcome, {user?.email?.split('@')[0] || 'Admin'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
          <DropdownMenuLabel className="text-slate-100">
            Platform Administrator
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-700" />
          <DropdownMenuItem 
            onClick={handleLogout}
            className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
