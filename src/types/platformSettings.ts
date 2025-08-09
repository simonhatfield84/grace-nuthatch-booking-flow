
export interface PlatformSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: string; // Changed from union type to string to match database
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlatformSettingsState {
  platform_name: string;
  support_email: string;
  maintenance_mode: boolean;
  allow_new_venues: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  email_signature: string;
  email_logo_url: string;
  email_primary_color: string;
  email_secondary_color: string;
  platform_logo_url: string;
  primary_color: string;
  secondary_color: string;
  footer_text: string;
  privacy_policy_url: string;
  terms_of_service_url: string;
  stripe_publishable_key: string;
  stripe_webhook_secret: string;
  trial_period_days: number;
  grace_period_days: number;
  auto_suspend_overdue: boolean;
  send_payment_reminders: boolean;
}

export interface PlatformAdmin {
  id: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  permissions: any;
  created_by?: string;
}
