
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailSettingsPanel } from "@/components/settings/EmailSettingsPanel";
import { VenueHoursSettings } from "@/components/settings/VenueHoursSettings";
import { DefaultTermsSettings } from "@/components/settings/DefaultTermsSettings";
import { TagManagement } from "@/components/settings/TagManagement";
import { WebhookConfiguration } from "@/components/settings/WebhookConfiguration";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="hours">Hours</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <DefaultTermsSettings />
        </TabsContent>

        <TabsContent value="hours" className="space-y-4">
          <VenueHoursSettings />
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <EmailSettingsPanel />
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          <TagManagement />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <WebhookConfiguration />
        </TabsContent>
      </Tabs>
    </div>
  );
}
