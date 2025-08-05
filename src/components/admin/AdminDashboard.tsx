
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { WebhookMonitor } from "./WebhookMonitor";
import { QuickReconciliation } from "./QuickReconciliation";
import { WebhookStatusMonitor } from "./WebhookStatusMonitor";

export const AdminDashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Force refresh of child components
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Dashboard
        </Button>
      </div>

      {/* Critical webhook status monitoring */}
      <WebhookStatusMonitor />

      {/* Quick Reconciliation for immediate fixes */}
      <QuickReconciliation />

      {/* Detailed webhook monitoring */}
      <WebhookMonitor />
    </div>
  );
};
