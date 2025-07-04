import { AppSidebar } from "@/components/AdminSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
export function AdminLayout() {
  return <>
      <AppSidebar />
      <main className="flex-1 flex flex-col">
        <header className="h-16 flex items-center px-6 border-b border-sidebar-border bg-sidebar">
          <SidebarTrigger className="mr-4" />
          <div className="grace-logo text-2xl font-bold">
            grace
          </div>
          <div className="ml-auto text-sm text-sidebar-foreground/70">Grace OS Dashboard</div>
        </header>
        <div className="flex-1 p-6 bg-background">
          <Outlet />
        </div>
      </main>
    </>;
}