
import { SecurityHardeningBanner } from "@/components/security/SecurityHardeningBanner";
import { EnhancedSecurityMonitor } from "@/components/security/EnhancedSecurityMonitor";
import { SecurityAlertsPanel } from "@/components/security/SecurityAlertsPanel";
import { SecurityAuditPanel } from "@/components/security/SecurityAuditPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const SecurityDashboard = () => {
  return (
    <div className="space-y-6">
      <SecurityHardeningBanner />
      
      <Tabs defaultValue="monitor" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monitor">Security Monitor</TabsTrigger>
          <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="monitor" className="space-y-4">
          <EnhancedSecurityMonitor />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <SecurityAlertsPanel />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <SecurityAuditPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};
