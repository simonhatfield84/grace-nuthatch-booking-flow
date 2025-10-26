
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VenueHoursSettings } from "@/components/settings/VenueHoursSettings";
import { StripeSettings } from "@/components/settings/StripeSettings";
import { DefaultTermsSettings } from "@/components/settings/DefaultTermsSettings";
import { TagManagement } from "@/components/settings/TagManagement";
import { EmailSettingsPanel } from "@/components/settings/EmailSettingsPanel";
import { EmailTemplatesList } from "@/components/settings/EmailTemplateEditor";
import { BrandingSettingsTab } from "@/components/settings/BrandingSettingsTab";
import { Settings as SettingsIcon, Clock, CreditCard, FileText, Tags, Mail, Palette } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const Settings = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'hours';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your venue settings and preferences</p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Hours</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="terms" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Terms</span>
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            <span className="hidden sm:inline">Tags</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="brand" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Brand</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hours">
          <VenueHoursSettings />
        </TabsContent>

        <TabsContent value="payments">
          <StripeSettings />
        </TabsContent>

        <TabsContent value="terms">
          <DefaultTermsSettings />
        </TabsContent>

        <TabsContent value="tags">
          <TagManagement />
        </TabsContent>

        <TabsContent value="email">
          <div className="space-y-8">
            <EmailSettingsPanel />
            <EmailTemplatesList />
          </div>
        </TabsContent>

        <TabsContent value="brand">
          <BrandingSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
