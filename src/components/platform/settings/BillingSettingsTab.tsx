
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CreditCard } from "lucide-react";
import { usePlatformSettingsV2, useUpdatePlatformSettingsV2 } from "@/hooks/usePlatformSettingsV2";
import { BillingSettingsData, billingSettingsSchema } from "@/lib/validations/platformSettings";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function BillingSettingsTab() {
  const { data: settings, isLoading } = usePlatformSettingsV2();
  const updateSettings = useUpdatePlatformSettingsV2();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty }
  } = useForm<BillingSettingsData>({
    resolver: zodResolver(billingSettingsSchema),
    defaultValues: {
      stripe_publishable_key: "",
      stripe_webhook_secret: "",
      trial_period_days: 14,
      grace_period_days: 7,
      auto_suspend_overdue: true,
      send_payment_reminders: true,
    },
  });

  const autoSuspend = watch("auto_suspend_overdue");
  const sendReminders = watch("send_payment_reminders");

  useEffect(() => {
    if (settings) {
      setValue("stripe_publishable_key", settings.stripe_publishable_key || "");
      setValue("stripe_webhook_secret", settings.stripe_webhook_secret || "");
      setValue("trial_period_days", settings.trial_period_days || 14);
      setValue("grace_period_days", settings.grace_period_days || 7);
      setValue("auto_suspend_overdue", settings.auto_suspend_overdue !== false);
      setValue("send_payment_reminders", settings.send_payment_reminders !== false);
    }
  }, [settings, setValue]);

  const onSubmit = (data: BillingSettingsData) => {
    updateSettings.mutate(data);
  };

  if (isLoading) {
    return <div>Loading billing settings...</div>;
  }

  return (
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
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stripe-publishable-key">Stripe Publishable Key</Label>
            <Input 
              id="stripe-publishable-key" 
              placeholder="pk_live_..."
              {...register("stripe_publishable_key")}
              error={errors.stripe_publishable_key?.message}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="stripe-webhook-secret">Stripe Webhook Secret</Label>
            <Input 
              id="stripe-webhook-secret" 
              type="password" 
              placeholder="whsec_..."
              {...register("stripe_webhook_secret")}
              error={errors.stripe_webhook_secret?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trial-period">Free Trial Period (days)</Label>
              <Input 
                id="trial-period" 
                type="number"
                {...register("trial_period_days", { valueAsNumber: true })}
                error={errors.trial_period_days?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grace-period">Grace Period (days)</Label>
              <Input 
                id="grace-period" 
                type="number"
                {...register("grace_period_days", { valueAsNumber: true })}
                error={errors.grace_period_days?.message}
              />
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
              <Switch
                checked={autoSuspend}
                onCheckedChange={(checked) => setValue("auto_suspend_overdue", checked, { shouldDirty: true })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Send payment reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Email reminders before payment due dates
                </p>
              </div>
              <Switch
                checked={sendReminders}
                onCheckedChange={(checked) => setValue("send_payment_reminders", checked, { shouldDirty: true })}
              />
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
            <p className="text-sm text-muted-foreground mb-4">
              Use the subscription management page to create, edit, and manage subscription plans, 
              view billing analytics, and handle subscription issues.
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={!isDirty || updateSettings.isPending}
            className="w-full"
          >
            {updateSettings.isPending ? "Saving..." : "Save Billing Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
