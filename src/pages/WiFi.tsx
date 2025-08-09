
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WifiPortalSettings } from "@/components/wifi/WifiPortalSettings";
import { WifiAnalytics } from "@/components/wifi/WifiAnalytics";
import { WifiDeviceManagement } from "@/components/wifi/WifiDeviceManagement";
import { WifiSessionManagement } from "@/components/wifi/WifiSessionManagement";
import { Wifi, BarChart3, Smartphone, Clock } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const WiFi = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'portal';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Wifi className="h-8 w-8" />
          WiFi Management
        </h1>
        <p className="text-muted-foreground">
          Manage your venue's WiFi portal, analytics, and guest access
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="portal" className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            <span className="hidden sm:inline">Portal Settings</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Devices</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Sessions</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portal">
          <WifiPortalSettings />
        </TabsContent>

        <TabsContent value="analytics">
          <WifiAnalytics />
        </TabsContent>

        <TabsContent value="devices">
          <WifiDeviceManagement />
        </TabsContent>

        <TabsContent value="sessions">
          <WifiSessionManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WiFi;
