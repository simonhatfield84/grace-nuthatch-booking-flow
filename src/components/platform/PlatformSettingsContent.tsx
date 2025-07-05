import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { usePlatformSettings, useUpdatePlatformSetting, usePlatformAdmins } from "@/hooks/usePlatformSettings";
import { useToast } from "@/hooks/use-toast";
import { Shield, Mail, Globe, Palette, Users, Save, CreditCard } from "lucide-react";

export function PlatformSettingsContent() {
  const { toast } = useToast();
  const { data: settings = [] } = usePlatformSettings();
  const { data: admins = [] } = usePlatformAdmins();
  const updateSetting = useUpdatePlatformSetting();

  const [platformName, setPlatformName] = useState("Grace Platform");
  const [supportEmail, setSupportEmail] = useState("support@graceplatform.com");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowNewVenues, setAllowNewVenues] = useState(true);

  const handleSaveSettings = async () => {
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: 'platform_name', value: platformName }),
        updateSetting.mutateAsync({ key: 'support_email', value: supportEmail }),
        updateSetting.mutateAsync({ key: 'maintenance_mode', value: maintenanceMode }),
        updateSetting.mutateAsync({ key: 'allow_new_venues', value: allowNewVenues }),
      ]);

      toast({
        title: "Settings saved",
        description: "Platform settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Settings</h1>
          <p className="text-muted-foreground">
            Manage system-wide configuration and administrative settings
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={updateSetting.isPending}>
          <Save className="h-4 w-4 mr-2" />
          Save All Settings
        </Button>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Core platform configuration options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">Platform Name</Label>
                  <Input
                    id="platform-name"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">Support Email</Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Temporarily disable platform access for maintenance
                    </p>
                  </div>
                  <Switch
                    checked={maintenanceMode}
                    onCheckedChange={setMaintenanceMode}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow New Venue Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable new venues to register on the platform
                    </p>
                  </div>
                  <Switch
                    checked={allowNewVenues}
                    onCheckedChange={setAllowNewVenues}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Platform Administrators
              </CardTitle>
              <CardDescription>
                Manage users with platform-wide administrative access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {admins.length > 0 ? (
                  <div className="space-y-3">
                    {admins.map((admin) => (
                      <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-orange-600" />
                          <div>
                            <div className="font-medium">Platform Administrator</div>
                            <div className="text-sm text-muted-foreground">
                              User ID: {admin.user_id}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={admin.is_active ? "default" : "secondary"}>
                            {admin.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No administrators configured</p>
                )}
                
                <Button variant="outline" className="w-full">
                  Add New Administrator
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing & Subscription Management
              </CardTitle>
              <CardDescription>
                Configure payment processing and subscription plans
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stripe-publishable-key">Stripe Publishable Key</Label>
                <Input id="stripe-publishable-key" placeholder="pk_live_..." />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stripe-webhook-secret">Stripe Webhook Secret</Label>
                <Input id="stripe-webhook-secret" type="password" placeholder="whsec_..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trial-period">Free Trial Period (days)</Label>
                  <Input id="trial-period" type="number" defaultValue="14" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grace-period">Grace Period (days)</Label>
                  <Input id="grace-period" type="number" defaultValue="7" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-suspend overdue accounts</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically suspend venues with overdue payments
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Send payment reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Email reminders before payment due dates
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Quick Actions</h4>
                  <Button variant="outline" asChild>
                    <a href="/platform/subscriptions">
                      Manage All Subscriptions
                    </a>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use the subscription management page to create, edit, and manage subscription plans, 
                  view billing analytics, and handle subscription issues.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>
                Manage email templates and notification settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input id="smtp-host" placeholder="smtp.example.com" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input id="smtp-port" placeholder="587" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-user">SMTP Username</Label>
                  <Input id="smtp-user" placeholder="username" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="from-email">From Email Address</Label>
                <Input id="from-email" type="email" placeholder="noreply@graceplatform.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-signature">Default Email Signature</Label>
                <Textarea
                  id="email-signature"
                  placeholder="Best regards,\nThe Grace Platform Team"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Platform Branding
              </CardTitle>
              <CardDescription>
                Customise the look and feel of the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform-logo">Platform Logo URL</Label>
                <Input id="platform-logo" placeholder="https://example.com/logo.png" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Colour</Label>
                  <Input id="primary-color" type="color" defaultValue="#ea580c" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Colour</Label>
                  <Input id="secondary-color" type="color" defaultValue="#1e293b" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer-text">Footer Text</Label>
                <Input id="footer-text" placeholder="© 2024 Grace Platform. All rights reserved." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="privacy-url">Privacy Policy URL</Label>
                <Input id="privacy-url" placeholder="https://graceplatform.com/privacy" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms-url">Terms of Service URL</Label>
                <Input id="terms-url" placeholder="https://graceplatform.com/terms" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
