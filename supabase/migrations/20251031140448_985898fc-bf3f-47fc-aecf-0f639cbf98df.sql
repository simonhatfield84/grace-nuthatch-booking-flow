-- Create venue Square settings table
CREATE TABLE IF NOT EXISTS public.venue_square_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  
  -- OAuth & API Configuration
  is_active BOOLEAN NOT NULL DEFAULT false,
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  
  -- OAuth Tokens (encrypted)
  access_token_sandbox_encrypted TEXT,
  refresh_token_sandbox_encrypted TEXT,
  access_token_production_encrypted TEXT,
  refresh_token_production_encrypted TEXT,
  
  -- Token Metadata
  token_expires_at_sandbox TIMESTAMPTZ,
  token_expires_at_production TIMESTAMPTZ,
  merchant_id_sandbox TEXT,
  merchant_id_production TEXT,
  
  -- Application IDs (user-configured)
  application_id_sandbox TEXT,
  application_id_production TEXT,
  
  -- Webhook Configuration
  webhook_secret_sandbox TEXT,
  webhook_secret_production TEXT,
  
  -- OAuth Grant Info
  scopes TEXT[],
  
  -- Configuration Status
  configuration_status JSONB DEFAULT '{
    "sandbox": {
      "oauth_connected": false,
      "locations_synced": false,
      "devices_synced": false,
      "webhook_configured": false
    },
    "production": {
      "oauth_connected": false,
      "locations_synced": false,
      "devices_synced": false,
      "webhook_configured": false
    }
  }'::jsonb,
  
  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  
  UNIQUE(venue_id)
);

-- RLS Policies
ALTER TABLE public.venue_square_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venue admins can manage their square settings"
  ON public.venue_square_settings FOR ALL
  USING (venue_id = get_user_venue(auth.uid()) AND is_admin(auth.uid(), venue_id));

CREATE POLICY "Venue users can view their square settings"
  ON public.venue_square_settings FOR SELECT
  USING (venue_id = get_user_venue(auth.uid()));

-- Indexes
CREATE INDEX idx_venue_square_settings_venue_id ON public.venue_square_settings(venue_id);

-- OAuth State Management Table
CREATE TABLE IF NOT EXISTS public.square_oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  state_token TEXT NOT NULL UNIQUE,
  environment TEXT NOT NULL CHECK (environment IN ('sandbox', 'production')),
  redirect_uri TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  used_at TIMESTAMPTZ
);

CREATE INDEX idx_square_oauth_states_state_token ON public.square_oauth_states(state_token);
CREATE INDEX idx_square_oauth_states_expires ON public.square_oauth_states(expires_at);

-- Cleanup function for expired OAuth states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.square_oauth_states
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$;