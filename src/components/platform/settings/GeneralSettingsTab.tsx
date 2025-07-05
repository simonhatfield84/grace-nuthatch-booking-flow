
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Globe } from "lucide-react";
import { usePlatformSettingsV2, useUpdatePlatformSettingsV2 } from "@/hooks/usePlatformSettingsV2";
import { GeneralSettingsData, generalSettingsSchema } from "@/lib/validations/platformSettings";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function GeneralSettingsTab() {
  const { data: settings, isLoading } = usePlatformSettingsV2();
  const updateSettings = useUpdatePlatformSettingsV2();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty }
  } = useForm<GeneralSettingsData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      platform_name: "Grace Platform",
      support_email: "support@graceplatform.com",
      maintenance_mode: false,
      allow_new_venues: true,
    },
  });

  const maintenanceMode = watch("maintenance_mode");
  const allowNewVenues = watch("allow_new_venues");

  useEffect(() => {
    if (settings) {
      setValue("platform_name", settings.platform_name || "Grace Platform");
      setValue("support_email", settings.support_email || "support@graceplatform.com");
      setValue("maintenance_mode", settings.maintenance_mode || false);
      setValue("allow_new_venues", settings.allow_new_venues !== false);
    }
  }, [settings, setValue]);

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
          <Globe className="h-5 w-5" />
          General Settings
        </CardTitle>
        <CardDescription>
          Core platform configuration options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platform-name">Platform Name</Label>
              <Input
                id="platform-name"
                {...register("platform_name")}
                error={errors.platform_name?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-email">Support Email</Label>
              <Input
                id="support-email"
                type="email"
                {...register("support_email")}
                error={errors.support_email?.message}
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
                onCheckedChange={(checked) => setValue("maintenance_mode", checked, { shouldDirty: true })}
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
                onCheckedChange={(checked) => setValue("allow_new_venues", checked, { shouldDirty: true })}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={!isDirty || updateSettings.isPending}
            className="w-full"
          >
            {updateSettings.isPending ? "Saving..." : "Save General Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
