
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { WebhookMonitor } from "./WebhookMonitor";
import { QuickReconciliation } from "./QuickReconciliation";

export const AdminDashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Force refresh of child components
    window.location.reload();
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

      {/* Quick Reconciliation for immediate fixes */}
      <QuickReconciliation />

      {/* Webhook monitoring */}
      <WebhookMonitor />
    </div>
  );
};
