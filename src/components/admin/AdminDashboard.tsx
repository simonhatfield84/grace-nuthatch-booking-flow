
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { WebhookMonitor } from "./WebhookMonitor";
import { QuickReconciliation } from "./QuickReconciliation";
import { WebhookStatusMonitor } from "./WebhookStatusMonitor";
import { LockAnalytics } from "./LockAnalytics";
import { ActiveHoldsInspector } from "./ActiveHoldsInspector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="holds">Active Holds</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Reconciliation for immediate fixes */}
          <QuickReconciliation />

          {/* Booking slot lock analytics */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Booking Slot Analytics</h2>
            <LockAnalytics />
          </div>
        </TabsContent>

        <TabsContent value="holds">
          <ActiveHoldsInspector />
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhookMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
};
