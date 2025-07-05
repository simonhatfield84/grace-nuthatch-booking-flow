
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail } from "lucide-react";
import { usePlatformSettingsV2, useUpdatePlatformSettingsV2 } from "@/hooks/usePlatformSettingsV2";
import { EmailSettingsData, emailSettingsSchema } from "@/lib/validations/platformSettings";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function EmailSettingsTab() {
  const { data: settings, isLoading } = usePlatformSettingsV2();
  const updateSettings = useUpdatePlatformSettingsV2();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty }
  } = useForm<EmailSettingsData>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      smtp_host: "",
      smtp_port: 587,
      smtp_username: "",
      smtp_password: "",
      from_email: "noreply@graceplatform.com",
      email_signature: "Best regards,\nThe Grace Platform Team",
    },
  });

  useEffect(() => {
    if (settings) {
      setValue("smtp_host", settings.smtp_host || "");
      setValue("smtp_port", settings.smtp_port || 587);
      setValue("smtp_username", settings.smtp_username || "");
      setValue("smtp_password", settings.smtp_password || "");
      setValue("from_email", settings.from_email || "noreply@graceplatform.com");
      setValue("email_signature", settings.email_signature || "Best regards,\nThe Grace Platform Team");
    }
  }, [settings, setValue]);

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
          Email Configuration
        </CardTitle>
        <CardDescription>
          Manage email templates and notification settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="smtp-host">SMTP Host</Label>
            <Input 
              id="smtp-host" 
              placeholder="smtp.example.com"
              {...register("smtp_host")}
              error={errors.smtp_host?.message}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-port">SMTP Port</Label>
              <Input 
                id="smtp-port" 
                type="number"
                placeholder="587"
                {...register("smtp_port", { valueAsNumber: true })}
                error={errors.smtp_port?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-user">SMTP Username</Label>
              <Input 
                id="smtp-user" 
                placeholder="username"
                {...register("smtp_username")}
                error={errors.smtp_username?.message}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp-password">SMTP Password</Label>
            <Input 
              id="smtp-password" 
              type="password"
              placeholder="password"
              {...register("smtp_password")}
              error={errors.smtp_password?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="from-email">From Email Address</Label>
            <Input 
              id="from-email" 
              type="email" 
              placeholder="noreply@graceplatform.com"
              {...register("from_email")}
              error={errors.from_email?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-signature">Default Email Signature</Label>
            <Textarea
              id="email-signature"
              placeholder="Best regards,&#10;The Grace Platform Team"
              rows={4}
              {...register("email_signature")}
            />
          </div>

          <Button 
            type="submit" 
            disabled={!isDirty || updateSettings.isPending}
            className="w-full"
          >
            {updateSettings.isPending ? "Saving..." : "Save Email Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
