/**
 * Environment Variable Validator
 * Validates required environment variables at function startup
 */

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  message?: string;
}

/**
 * Validate required environment variables
 */
export function validateEnv(required: string[]): EnvValidationResult {
  const missing = required.filter(key => !Deno.env.get(key));
  
  if (missing.length > 0) {
    return {
      valid: false,
      missing,
      message: `Missing required environment variables: ${missing.join(', ')}`
    };
  }
  
  return {
    valid: true,
    missing: []
  };
}

/**
 * Validate Stripe environment (requires either test or live keys)
 */
export function validateStripeEnv(): EnvValidationResult {
  const hasTestKey = !!Deno.env.get('STRIPE_TEST_SECRET_KEY');
  const hasLiveKey = !!Deno.env.get('STRIPE_SECRET_KEY');
  
  if (!hasTestKey && !hasLiveKey) {
    return {
      valid: false,
      missing: ['STRIPE_SECRET_KEY or STRIPE_TEST_SECRET_KEY'],
      message: 'Missing Stripe API keys. Please set either STRIPE_SECRET_KEY or STRIPE_TEST_SECRET_KEY'
    };
  }
  
  return {
    valid: true,
    missing: []
  };
}

/**
 * Throw error if validation fails
 */
export function requireEnv(required: string[]): void {
  const result = validateEnv(required);
  if (!result.valid) {
    throw new Error(result.message);
  }
}

/**
 * Throw error if Stripe validation fails
 */
export function requireStripeEnv(): void {
  const result = validateStripeEnv();
  if (!result.valid) {
    throw new Error(result.message);
  }
}

/**
 * Get Stripe secret key based on environment
 */
export function getStripeSecretKey(): string {
  const isLive = Deno.env.get('STRIPE_ENV') === 'live';
  const key = isLive 
    ? Deno.env.get('STRIPE_SECRET_KEY')
    : Deno.env.get('STRIPE_TEST_SECRET_KEY');
    
  if (!key) {
    throw new Error(`Missing Stripe key for ${isLive ? 'live' : 'test'} mode`);
  }
  
  return key;
}

/**
 * Get Stripe webhook secret based on environment
 */
export function getStripeWebhookSecret(): string {
  const isLive = Deno.env.get('STRIPE_ENV') === 'live';
  const secret = isLive
    ? Deno.env.get('STRIPE_WEBHOOK_SECRET_LIVE')
    : Deno.env.get('STRIPE_WEBHOOK_SECRET_TEST');
    
  if (!secret) {
    throw new Error(`Missing webhook secret for ${isLive ? 'live' : 'test'} mode`);
  }
  
  return secret;
}
