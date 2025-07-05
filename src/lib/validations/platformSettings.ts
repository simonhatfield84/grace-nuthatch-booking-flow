
import { z } from "zod";

export const generalSettingsSchema = z.object({
  platform_name: z.string().min(1, "Platform name is required"),
  support_email: z.string().email("Invalid email address"),
  maintenance_mode: z.boolean(),
  allow_new_venues: z.boolean(),
});

export const emailSettingsSchema = z.object({
  smtp_host: z.string().optional(),
  smtp_port: z.number().min(1).max(65535),
  smtp_username: z.string().optional(),
  smtp_password: z.string().optional(),
  from_email: z.string().email("Invalid email address"),
  email_signature: z.string().optional(),
});

export const billingSettingsSchema = z.object({
  stripe_publishable_key: z.string().optional(),
  stripe_webhook_secret: z.string().optional(),
  trial_period_days: z.number().min(0),
  grace_period_days: z.number().min(0),
  auto_suspend_overdue: z.boolean(),
  send_payment_reminders: z.boolean(),
});

export const brandingSettingsSchema = z.object({
  platform_logo_url: z.string().optional(),
  primary_color: z.string().min(1, "Primary color is required"),
  secondary_color: z.string().min(1, "Secondary color is required"),
  footer_text: z.string().optional(),
  privacy_policy_url: z.string().optional(),
  terms_of_service_url: z.string().optional(),
});

export type GeneralSettingsData = z.infer<typeof generalSettingsSchema>;
export type EmailSettingsData = z.infer<typeof emailSettingsSchema>;
export type BillingSettingsData = z.infer<typeof billingSettingsSchema>;
export type BrandingSettingsData = z.infer<typeof brandingSettingsSchema>;
