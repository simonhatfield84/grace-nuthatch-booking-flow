
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralSettingsTab } from "./settings/GeneralSettingsTab";
import { AdministratorsTab } from "./settings/AdministratorsTab";
import { BillingSettingsTab } from "./settings/BillingSettingsTab";
import { EmailSettingsTab } from "./settings/EmailSettingsTab";
import { BrandingSettingsTab } from "./settings/BrandingSettingsTab";

export function PlatformSettingsContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Settings</h1>
          <p className="text-muted-foreground">
            Manage system-wide configuration and administrative settings
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="admins">Administrators</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <GeneralSettingsTab />
        </TabsContent>

        <TabsContent value="admins" className="space-y-4">
          <AdministratorsTab />
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <BillingSettingsTab />
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <EmailSettingsTab />
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <BrandingSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
