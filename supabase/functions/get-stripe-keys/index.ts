
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EncryptedData {
  encryptedData: string;
  iv: string;
  salt: string;
}

class StripeKeyDecryption {
  private static async getEncryptionKey(environment: 'test' | 'live'): Promise<CryptoKey> {
    // In production, these would be retrieved from Supabase Vault secrets
    const keyMaterial = environment === 'test' 
      ? 'stripe_test_encryption_master_key_2024' 
      : 'stripe_live_encryption_master_key_2024';
    
    const encoder = new TextEncoder();
    const keyData = await crypto.subtle.importKey(
      'raw',
      encoder.encode(keyMaterial),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return keyData;
  }

  private static async deriveKey(
    keyMaterial: CryptoKey, 
    salt: Uint8Array, 
    venueId: string
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const venueData = encoder.encode(venueId);
    const combinedSalt = new Uint8Array(salt.length + venueData.length);
    combinedSalt.set(salt);
    combinedSalt.set(venueData, salt.length);

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: combinedSalt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static async decryptStripeKey(
    encryptedData: EncryptedData, 
    venueId: string, 
    environment: 'test' | 'live'
  ): Promise<string> {
    try {
      // Convert base64 back to Uint8Array
      const encrypted = Uint8Array.from(atob(encryptedData.encryptedData), c => c.charCodeAt(0));
      const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
      const salt = Uint8Array.from(atob(encryptedData.salt), c => c.charCodeAt(0));
      
      // Get and derive encryption key
      const keyMaterial = await this.getEncryptionKey(environment);
      const derivedKey = await this.deriveKey(keyMaterial, salt, venueId);
      
      // Decrypt the data
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        derivedKey,
        encrypted
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt Stripe key');
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

  // Security check: Only allow service_role to access this endpoint
  const authHeader = req.headers.get('authorization') || '';
  const role = req.headers.get('x-supabase-role');
  
  if (role !== 'service_role' && !authHeader.includes('service_role')) {
    console.warn('⚠️ Unauthorized access attempt to get-stripe-keys');
    return new Response(
      JSON.stringify({ 
        error: 'This endpoint is for server use only',
        code: 'unauthorized_access'
      }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const { venue_id, environment, key_type } = await req.json();

    if (!venue_id || !environment || !key_type) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🔐 Secure key retrieval request for venue ${venue_id}, environment: ${environment}, type: ${key_type}`);

    // Get venue's Stripe settings
    const { data: stripeSettings, error } = await supabaseClient
      .from('venue_stripe_settings')
      .select('*')
      .eq('venue_id', venue_id)
      .single();

    if (error || !stripeSettings) {
      console.error('Failed to retrieve Stripe settings:', error);
      return new Response(
        JSON.stringify({ error: "Stripe settings not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!stripeSettings.is_active) {
      return new Response(
        JSON.stringify({ error: "Stripe is not active for this venue" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result = {};

    try {
      if (key_type === 'secret') {
        // Decrypt and return secret key
        const encryptedField = environment === 'test' ? 'secret_key_test_encrypted' : 'secret_key_live_encrypted';
        const encryptedData = stripeSettings[encryptedField];

        if (encryptedData) {
          const parsedData: EncryptedData = JSON.parse(encryptedData);
          const decryptedKey = await StripeKeyDecryption.decryptStripeKey(
            parsedData,
            venue_id,
            environment
          );
          
          result = { secret_key: decryptedKey };

          // Audit the key access
          await supabaseClient
            .from('stripe_key_audit')
            .insert([{
              venue_id,
              user_id: null, // System access
              action: 'decrypted',
              environment,
              key_type: 'secret',
              success: true,
              metadata: { 
                accessed_via: 'edge_function',
                request_origin: req.headers.get('origin') || 'unknown'
              }
            }]);

          console.log(`✅ Secret key successfully decrypted for venue ${venue_id}`);
        }
      } else if (key_type === 'publishable') {
        // Return publishable key (not encrypted)
        const publishableField = environment === 'test' ? 'publishable_key_test' : 'publishable_key_live';
        result = { publishable_key: stripeSettings[publishableField] };
      } else if (key_type === 'webhook') {
        // Return webhook secret (not encrypted)
        const webhookField = environment === 'test' ? 'webhook_secret_test' : 'webhook_secret_live';
        result = { webhook_secret: stripeSettings[webhookField] };
      } else if (key_type === 'all') {
        // Return all keys for the specified environment
        const secretField = environment === 'test' ? 'secret_key_test_encrypted' : 'secret_key_live_encrypted';
        const publishableField = environment === 'test' ? 'publishable_key_test' : 'publishable_key_live';
        const webhookField = environment === 'test' ? 'webhook_secret_test' : 'webhook_secret_live';

        result = {
          publishable_key: stripeSettings[publishableField],
          webhook_secret: stripeSettings[webhookField],
        };

        // Decrypt secret key if available
        const encryptedData = stripeSettings[secretField];
        if (encryptedData) {
          const parsedData: EncryptedData = JSON.parse(encryptedData);
          const decryptedKey = await StripeKeyDecryption.decryptStripeKey(
            parsedData,
            venue_id,
            environment
          );
          result = { ...result, secret_key: decryptedKey };

          // Audit the key access
          await supabaseClient
            .from('stripe_key_audit')
            .insert([{
              venue_id,
              user_id: null,
              action: 'decrypted',
              environment,
              key_type: 'secret',
              success: true,
              metadata: { 
                accessed_via: 'edge_function',
                request_origin: req.headers.get('origin') || 'unknown',
                retrieved_all_keys: true
              }
            }]);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          environment,
          test_mode: stripeSettings.test_mode,
          ...result
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (decryptionError) {
      console.error('Decryption error:', decryptionError);

      // Audit the failed decryption
      await supabaseClient
        .from('stripe_key_audit')
        .insert([{
          venue_id,
          user_id: null,
          action: 'decrypted',
          environment,
          key_type: 'secret',
          success: false,
          error_message: decryptionError.message,
          metadata: { 
            accessed_via: 'edge_function',
            request_origin: req.headers.get('origin') || 'unknown'
          }
        }]);

      return new Response(
        JSON.stringify({ error: "Failed to decrypt keys" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error('❌ Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
