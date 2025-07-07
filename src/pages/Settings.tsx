
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VenueHoursSettings } from "@/components/settings/VenueHoursSettings";
import { EmailSettings } from "@/components/settings/EmailSettings";
import { TagManagement } from "@/components/settings/TagManagement";
import { StripeSettings } from "@/components/settings/StripeSettings";
import { Settings as SettingsIcon, Clock, Mail, Tag, CreditCard } from "lucide-react";

const Settings = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="hours" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Hours
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hours">
          <VenueHoursSettings />
        </TabsContent>

        <TabsContent value="payments">
          <StripeSettings />
        </TabsContent>

        <TabsContent value="email">
          <EmailSettings />
        </TabsContent>

        <TabsContent value="tags">
          <TagManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
