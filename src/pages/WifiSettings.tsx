
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WifiPortalConfig } from "@/components/wifi/settings/WifiPortalConfig";
import { WifiTermsEditor } from "@/components/wifi/settings/WifiTermsEditor";
import { WifiBrandingSettings } from "@/components/wifi/settings/WifiBrandingSettings";
import { WifiAnalyticsTab } from "@/components/wifi/settings/WifiAnalyticsTab";
import { WifiAdvancedSettings } from "@/components/wifi/settings/WifiAdvancedSettings";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useWifiSettings } from "@/hooks/useWifiSettings";
import { Wifi, Settings, FileText, Palette, BarChart3, Cog } from "lucide-react";
import { useEffect } from "react";

const WifiSettings = () => {
  const { data: profile } = useUserProfile();
  const { settings, initializeSettings, isLoading } = useWifiSettings(profile?.venue_id);

  // Initialize settings if they don't exist
  useEffect(() => {
    if (profile?.venue_id && !settings && !isLoading) {
      initializeSettings();
    }
  }, [profile?.venue_id, settings, isLoading, initializeSettings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading WiFi settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">WiFi Settings</h1>
        <p className="text-muted-foreground">Manage your WiFi portal and guest access</p>
      </div>

      <Tabs defaultValue="portal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="portal" className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            <span className="hidden sm:inline">Portal</span>
          </TabsTrigger>
          <TabsTrigger value="terms" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Terms</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Branding</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Cog className="h-4 w-4" />
            <span className="hidden sm:inline">Advanced</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portal">
          <WifiPortalConfig settings={settings} venueId={profile?.venue_id} />
        </TabsContent>

        <TabsContent value="terms">
          <WifiTermsEditor settings={settings} venueId={profile?.venue_id} />
        </TabsContent>

        <TabsContent value="branding">
          <WifiBrandingSettings settings={settings} venueId={profile?.venue_id} />
        </TabsContent>

        <TabsContent value="analytics">
          <WifiAnalyticsTab />
        </TabsContent>

        <TabsContent value="advanced">
          <WifiAdvancedSettings settings={settings} venueId={profile?.venue_id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WifiSettings;
