
import { VaultStripeSettings } from "./VaultStripeSettings";
import { StripeSecurityDashboard } from "./StripeSecurityDashboard";
import { PaymentReconciliation } from "@/components/admin/PaymentReconciliation";
import { WebhookEventsMonitor } from "@/components/admin/WebhookEventsMonitor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const StripeSettings = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Vault Settings</TabsTrigger>
          <TabsTrigger value="security">Security Dashboard</TabsTrigger>
          <TabsTrigger value="reconciliation">Payment Tools</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <VaultStripeSettings />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <StripeSecurityDashboard />
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-4">
          <PaymentReconciliation />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <WebhookEventsMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
};
