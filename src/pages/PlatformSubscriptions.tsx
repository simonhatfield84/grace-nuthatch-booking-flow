
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubscriptionOverview } from "@/components/platform/SubscriptionOverview";
import { SubscriptionPlansManager } from "@/components/platform/SubscriptionPlansManager";

export default function PlatformSubscriptions() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground">
            Manage billing, subscriptions, and revenue analytics
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <SubscriptionOverview />
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <SubscriptionPlansManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
