
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CreditCard } from "lucide-react";
import { usePlatformSettingsV2, useUpdatePlatformSettingsV2 } from "@/hooks/usePlatformSettingsV2";
import { BillingSettingsData, billingSettingsSchema } from "@/lib/validations/platformSettings";
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

export function BillingSettingsTab() {
  const { data: settings, isLoading } = usePlatformSettingsV2();
  const updateSettings = useUpdatePlatformSettingsV2();

  const form = useForm<BillingSettingsData>({
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

  useEffect(() => {
    if (settings) {
      form.reset({
        stripe_publishable_key: settings.stripe_publishable_key || "",
        stripe_webhook_secret: settings.stripe_webhook_secret || "",
        trial_period_days: settings.trial_period_days || 14,
        grace_period_days: settings.grace_period_days || 7,
        auto_suspend_overdue: settings.auto_suspend_overdue !== false,
        send_payment_reminders: settings.send_payment_reminders !== false,
      });
    }
  }, [settings, form]);

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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="stripe_publishable_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stripe Publishable Key</FormLabel>
                  <FormControl>
                    <Input placeholder="pk_live_..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="stripe_webhook_secret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stripe Webhook Secret</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="whsec_..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="trial_period_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Free Trial Period (days)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
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
                name="grace_period_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grace Period (days)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="auto_suspend_overdue"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Auto-suspend overdue accounts</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Automatically suspend venues with overdue payments
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
                name="send_payment_reminders"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Send payment reminders</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Email reminders before payment due dates
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
              disabled={!form.formState.isDirty || updateSettings.isPending}
              className="w-full"
            >
              {updateSettings.isPending ? "Saving..." : "Save Billing Settings"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
