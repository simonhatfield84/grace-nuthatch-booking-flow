
import { AppSidebar } from "@/components/AdminSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";

export function AdminLayout() {
  return <>
      <AppSidebar />
      <main className="flex-1 flex flex-col">
        <header className="h-16 flex items-center px-6 border-b bg-white shadow-sm">
          <SidebarTrigger className="mr-4 text-grace-primary hover:bg-grace-background" />
          <div className="grace-logo text-3xl font-bold">
            grace
          </div>
          <div className="ml-auto text-sm text-grace-dark/70 font-poppins">
            Grace OS Dashboard
          </div>
        </header>
        <div className="flex-1 p-6 bg-grace-background min-h-screen">
          <Outlet />
        </div>
      </main>
    </>;
}
