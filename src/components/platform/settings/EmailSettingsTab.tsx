
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { usePlatformSettingsV2, useUpdatePlatformSettingsV2 } from "@/hooks/usePlatformSettingsV2";
import { EmailSettingsData, emailSettingsSchema } from "@/lib/validations/platformSettings";
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
import { Textarea } from "@/components/ui/textarea";

export function EmailSettingsTab() {
  const { data: settings, isLoading } = usePlatformSettingsV2();
  const updateSettings = useUpdatePlatformSettingsV2();

  const form = useForm<EmailSettingsData>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      smtp_host: "",
      smtp_port: 587,
      smtp_username: "",
      smtp_password: "",
      from_email: "noreply@grace-os.co.uk",
      from_name: "Fred at Grace OS",
      email_signature: "Best regards,\nFred at Grace OS\nThe Grace Platform Team",
      email_logo_url: "",
      email_primary_color: "#ea580c",
      email_secondary_color: "#1e293b",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        smtp_host: settings.smtp_host || "",
        smtp_port: settings.smtp_port || 587,
        smtp_username: settings.smtp_username || "",
        smtp_password: settings.smtp_password || "",
        from_email: settings.from_email || "noreply@grace-os.co.uk",
        from_name: settings.from_name || "Fred at Grace OS",
        email_signature: settings.email_signature || "Best regards,\nFred at Grace OS\nThe Grace Platform Team",
        email_logo_url: settings.email_logo_url || "",
        email_primary_color: settings.email_primary_color || "#ea580c",
        email_secondary_color: settings.email_secondary_color || "#1e293b",
      });
    }
  }, [settings, form]);

  const onSubmit = (data: EmailSettingsData) => {
    updateSettings.mutate(data);
  };

  if (isLoading) {
    return <div>Loading email settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Configuration & Branding
        </CardTitle>
        <CardDescription>
          Manage email settings, templates and Grace OS branding
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">SMTP Configuration</h3>
              
              <FormField
                control={form.control}
                name="smtp_host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SMTP Host</FormLabel>
                    <FormControl>
                      <Input placeholder="smtp.example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="smtp_port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Port</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="587"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="smtp_username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="smtp_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SMTP Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Email Identity & Branding</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="from_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="noreply@grace-os.co.uk" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="from_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Fred at Grace OS" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email_logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Logo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://grace-os.co.uk/logo.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email_primary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Brand Color</FormLabel>
                      <FormControl>
                        <Input type="color" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email_secondary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Brand Color</FormLabel>
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
                name="email_signature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Email Signature</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Best regards,&#10;Fred at Grace OS&#10;The Grace Platform Team"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              disabled={!form.formState.isDirty || updateSettings.isPending}
              className="w-full"
            >
              {updateSettings.isPending ? "Saving..." : "Save Email Settings"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
