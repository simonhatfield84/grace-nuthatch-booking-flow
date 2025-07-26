
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";
import { usePlatformSettingsV2, useUpdatePlatformSettingsV2 } from "@/hooks/usePlatformSettingsV2";
import { BrandingSettingsData, brandingSettingsSchema } from "@/lib/validations/platformSettings";
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

export function BrandingSettingsTab() {
  const { data: settings, isLoading } = usePlatformSettingsV2();
  const updateSettings = useUpdatePlatformSettingsV2();

  const form = useForm<BrandingSettingsData>({
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
      form.reset({
        platform_logo_url: settings.platform_logo_url || "",
        primary_color: settings.primary_color || "#ea580c",
        secondary_color: settings.secondary_color || "#1e293b",
        footer_text: settings.footer_text || "© 2024 Grace Platform. All rights reserved.",
        privacy_policy_url: settings.privacy_policy_url || "",
        terms_of_service_url: settings.terms_of_service_url || "",
      });
    }
  }, [settings, form]);

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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="platform_logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform Logo URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/logo.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="primary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Colour</FormLabel>
                    <FormControl>
                      <Input type="color" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="secondary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Colour</FormLabel>
                    <FormControl>
                      <Input type="color" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="footer_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Footer Text</FormLabel>
                  <FormControl>
                    <Input placeholder="© 2024 Grace Platform. All rights reserved." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="privacy_policy_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Privacy Policy URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://graceplatform.com/privacy" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms_of_service_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms of Service URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://graceplatform.com/terms" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={!form.formState.isDirty || updateSettings.isPending}
              className="w-full"
            >
              {updateSettings.isPending ? "Saving..." : "Save Branding Settings"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
