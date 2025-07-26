
import { Outlet } from "react-router-dom";

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <Outlet />
      </div>
    </div>
  );
}
