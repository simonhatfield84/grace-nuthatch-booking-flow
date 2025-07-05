
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette } from "lucide-react";
import { usePlatformSettingsV2, useUpdatePlatformSettingsV2 } from "@/hooks/usePlatformSettingsV2";
import { BrandingSettingsData, brandingSettingsSchema } from "@/lib/validations/platformSettings";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function BrandingSettingsTab() {
  const { data: settings, isLoading } = usePlatformSettingsV2();
  const updateSettings = useUpdatePlatformSettingsV2();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty }
  } = useForm<BrandingSettingsData>({
    resolver: zodResolver(brandingSettingsSchema),
    defaultValues: {
      platform_logo_url: "",
      primary_color: "#ea580c",
      secondary_color: "#1e293b",
      footer_text: "© 2024 Grace Platform. All rights reserved.",
      privacy_policy_url: "",
      terms_of_service_url: "",
    },
  });

  useEffect(() => {
    if (settings) {
      setValue("platform_logo_url", settings.platform_logo_url || "");
      setValue("primary_color", settings.primary_color || "#ea580c");
      setValue("secondary_color", settings.secondary_color || "#1e293b");
      setValue("footer_text", settings.footer_text || "© 2024 Grace Platform. All rights reserved.");
      setValue("privacy_policy_url", settings.privacy_policy_url || "");
      setValue("terms_of_service_url", settings.terms_of_service_url || "");
    }
  }, [settings, setValue]);

  const onSubmit = (data: BrandingSettingsData) => {
    updateSettings.mutate(data);
  };

  if (isLoading) {
    return <div>Loading branding settings...</div>;
  }

  return (
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
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform-logo">Platform Logo URL</Label>
            <Input 
              id="platform-logo" 
              placeholder="https://example.com/logo.png"
              {...register("platform_logo_url")}
              error={errors.platform_logo_url?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Colour</Label>
              <Input 
                id="primary-color" 
                type="color"
                {...register("primary_color")}
                error={errors.primary_color?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary-color">Secondary Colour</Label>
              <Input 
                id="secondary-color" 
                type="color"
                {...register("secondary_color")}
                error={errors.secondary_color?.message}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer-text">Footer Text</Label>
            <Input 
              id="footer-text" 
              placeholder="© 2024 Grace Platform. All rights reserved."
              {...register("footer_text")}
              error={errors.footer_text?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="privacy-url">Privacy Policy URL</Label>
            <Input 
              id="privacy-url" 
              placeholder="https://graceplatform.com/privacy"
              {...register("privacy_policy_url")}
              error={errors.privacy_policy_url?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms-url">Terms of Service URL</Label>
            <Input 
              id="terms-url" 
              placeholder="https://graceplatform.com/terms"
              {...register("terms_of_service_url")}
              error={errors.terms_of_service_url?.message}
            />
          </div>

          <Button 
            type="submit" 
            disabled={!isDirty || updateSettings.isPending}
            className="w-full"
          >
            {updateSettings.isPending ? "Saving..." : "Save Branding Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
