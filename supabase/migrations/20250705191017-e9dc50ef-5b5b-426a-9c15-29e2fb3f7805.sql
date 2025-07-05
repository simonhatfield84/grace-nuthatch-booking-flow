
-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  billing_interval TEXT NOT NULL DEFAULT 'month', -- 'month' or 'year'
  features JSONB DEFAULT '[]'::jsonb,
  max_venues INTEGER,
  max_bookings_per_month INTEGER,
  is_active BOOLEAN DEFAULT true,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create venue subscriptions table
CREATE TABLE public.venue_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
  subscription_plan_id UUID REFERENCES public.subscription_plans(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'past_due', 'unpaid'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment transactions table
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.venue_subscriptions(id),
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL, -- 'succeeded', 'failed', 'pending', 'cancelled'
  payment_method TEXT,
  failure_reason TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create billing events table for audit trail
CREATE TABLE public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.venue_subscriptions(id),
  event_type TEXT NOT NULL, -- 'subscription_created', 'payment_succeeded', 'payment_failed', etc.
  data JSONB,
  stripe_event_id TEXT,
  processed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all billing tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (public read, admin write)
CREATE POLICY "Anyone can view active subscription plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Super admins can manage subscription plans" ON public.subscription_plans
  FOR ALL USING (is_super_admin(auth.uid()));

-- RLS Policies for venue_subscriptions
CREATE POLICY "Venues can view their own subscriptions" ON public.venue_subscriptions
  FOR SELECT USING (venue_id = get_user_venue(auth.uid()));

CREATE POLICY "Super admins can view all subscriptions" ON public.venue_subscriptions
  FOR SELECT USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage all subscriptions" ON public.venue_subscriptions
  FOR ALL USING (is_super_admin(auth.uid()));

-- RLS Policies for payment_transactions
CREATE POLICY "Venues can view their own payment transactions" ON public.payment_transactions
  FOR SELECT USING (venue_id = get_user_venue(auth.uid()));

CREATE POLICY "Super admins can view all payment transactions" ON public.payment_transactions
  FOR SELECT USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage payment transactions" ON public.payment_transactions
  FOR ALL USING (is_super_admin(auth.uid()));

-- RLS Policies for billing_events
CREATE POLICY "Venues can view their own billing events" ON public.billing_events
  FOR SELECT USING (venue_id = get_user_venue(auth.uid()));

CREATE POLICY "Super admins can view all billing events" ON public.billing_events
  FOR SELECT USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage billing events" ON public.billing_events
  FOR ALL USING (is_super_admin(auth.uid()));

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price_cents, features, max_venues, max_bookings_per_month, stripe_price_id) VALUES
('Starter', 'Perfect for small venues getting started', 2900, '["Up to 100 bookings/month", "Basic reporting", "Email support"]'::jsonb, 1, 100, null),
('Professional', 'Great for growing businesses', 7900, '["Up to 500 bookings/month", "Advanced reporting", "Priority support", "Custom branding"]'::jsonb, 1, 500, null),
('Enterprise', 'For large venues and restaurant groups', 19900, '["Unlimited bookings", "Advanced analytics", "Dedicated support", "API access", "Multi-venue management"]'::jsonb, 10, null, null);

-- Create indexes for performance
CREATE INDEX idx_venue_subscriptions_venue_id ON public.venue_subscriptions(venue_id);
CREATE INDEX idx_venue_subscriptions_status ON public.venue_subscriptions(status);
CREATE INDEX idx_payment_transactions_venue_id ON public.payment_transactions(venue_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_billing_events_venue_id ON public.billing_events(venue_id);
CREATE INDEX idx_billing_events_event_type ON public.billing_events(event_type);
