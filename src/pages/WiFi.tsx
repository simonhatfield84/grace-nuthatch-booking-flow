
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WifiPortalSettings } from "@/components/wifi/WifiPortalSettings";
import { WifiPortalBrandingSettings } from "@/components/wifi/WifiPortalBrandingSettings";
import { WifiAnalytics } from "@/components/wifi/WifiAnalytics";
import { WifiDeviceManagement } from "@/components/wifi/WifiDeviceManagement";
import { WifiSessionManagement } from "@/components/wifi/WifiSessionManagement";

const WiFi = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">WiFi Portal Management</h1>
        <p className="text-muted-foreground">
          Configure and manage your venue's guest WiFi portal system
        </p>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="settings">Portal Settings</TabsTrigger>
          <TabsTrigger value="branding">Branding & Design</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="devices">Device Management</TabsTrigger>
          <TabsTrigger value="sessions">Session Management</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <WifiPortalSettings />
        </TabsContent>

        <TabsContent value="branding">
          <WifiPortalBrandingSettings />
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
