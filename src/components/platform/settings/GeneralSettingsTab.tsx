
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import { usePlatformSettingsV2, useUpdatePlatformSettingsV2 } from "@/hooks/usePlatformSettingsV2";
import { GeneralSettingsData, generalSettingsSchema } from "@/lib/validations/platformSettings";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function GeneralSettingsTab() {
  const { data: settings, isLoading } = usePlatformSettingsV2();
  const updateSettings = useUpdatePlatformSettingsV2();

  const form = useForm<GeneralSettingsData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      platform_name: "Grace Platform",
      support_email: "support@graceplatform.com",
      maintenance_mode: false,
      allow_new_venues: true,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        platform_name: settings.platform_name || "Grace Platform",
        support_email: settings.support_email || "support@graceplatform.com",
        maintenance_mode: settings.maintenance_mode || false,
        allow_new_venues: settings.allow_new_venues !== false,
      });
    }
  }, [settings, form]);

  const onSubmit = (data: GeneralSettingsData) => {
    updateSettings.mutate(data);
  };

  if (isLoading) {
    return <div>Loading general settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          General Settings
        </CardTitle>
        <CardDescription>
          Configure basic platform settings and system preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="platform_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Grace Platform" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="support_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Support Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="support@graceplatform.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="maintenance_mode"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Maintenance Mode</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Put the platform in maintenance mode
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allow_new_venues"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Allow New Venues</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Allow new venue registrations
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              disabled={!form.formState.isDirty || updateSettings.isPending}
              className="w-full"
            >
              {updateSettings.isPending ? "Saving..." : "Save General Settings"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
