
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to decrypt Stripe keys
const decryptStripeKey = async (encryptedData: string, venueId: string, environment: 'test' | 'live'): Promise<string> => {
  try {
    const parsedData = JSON.parse(encryptedData);
    
    // Use the same decryption logic as in the encryption utility
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

    const venueData = encoder.encode(venueId);
    const salt = Uint8Array.from(atob(parsedData.salt), c => c.charCodeAt(0));
    const combinedSalt = new Uint8Array(salt.length + venueData.length);
    combinedSalt.set(salt);
    combinedSalt.set(venueData, salt.length);

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: combinedSalt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyData,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const encrypted = Uint8Array.from(atob(parsedData.encryptedData), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(parsedData.iv), c => c.charCodeAt(0));
    
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
};

// Helper function to validate Stripe key format
const validateStripeKey = (key: string, environment: 'test' | 'live'): boolean => {
  if (!key || typeof key !== 'string') return false;
  
  if (environment === 'test') {
    return key.startsWith('sk_test_') && key.length > 20;
  } else {
    return key.startsWith('sk_live_') && key.length > 20;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      bookingId, 
      amount, 
      currency = 'gbp', 
      description,
      existing_payment_intent_id,
      venue_id 
    } = await req.json()

    console.log('Creating payment intent:', {
      bookingId,
      amount,
      currency,
      description,
      existing_payment_intent_id,
      venue_id
    })

    if (!venue_id) {
      console.error('Missing venue_id in request');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Venue ID is required',
          details: 'venue_id must be provided in the request body'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Get venue's Stripe settings
    console.log('Fetching Stripe settings for venue:', venue_id);
    const { data: stripeSettings, error: settingsError } = await supabase
      .from('venue_stripe_settings')
      .select('*')
      .eq('venue_id', venue_id)
      .single();

    if (settingsError || !stripeSettings) {
      console.error('Failed to retrieve Stripe settings:', settingsError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Stripe settings not found for this venue',
          details: settingsError?.message || 'No Stripe configuration exists'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!stripeSettings.is_active) {
      console.error('Stripe is not active for this venue');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Stripe payments are not enabled for this venue',
          details: 'Please contact the venue to enable payments'
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Determine which environment to use
    const environment = stripeSettings.test_mode ? 'test' : 'live';
    const encryptedKeyField = environment === 'test' ? 'secret_key_test_encrypted' : 'secret_key_live_encrypted';
    const encryptedKeyData = stripeSettings[encryptedKeyField];

    if (!encryptedKeyData) {
      console.error(`No ${environment} secret key configured for venue`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Stripe ${environment} mode secret key not configured`,
          details: 'Please configure your Stripe secret key in the venue settings'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Decrypt the Stripe secret key
    let stripeSecretKey: string;
    try {
      stripeSecretKey = await decryptStripeKey(encryptedKeyData, venue_id, environment);
      console.log(`Successfully decrypted ${environment} Stripe key`);
    } catch (decryptError) {
      console.error('Failed to decrypt Stripe key:', decryptError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to decrypt Stripe configuration',
          details: 'Stripe key decryption failed - please reconfigure your keys'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate the decrypted key
    if (!validateStripeKey(stripeSecretKey, environment)) {
      console.error('Invalid Stripe key format after decryption');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid Stripe key configuration',
          details: 'Stripe key format is invalid - please reconfigure your keys'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Stripe with the decrypted key
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })

    // If we have an existing payment intent ID, retrieve it
    if (existing_payment_intent_id) {
      try {
        const existingIntent = await stripe.paymentIntents.retrieve(existing_payment_intent_id)
        console.log('Retrieved existing payment intent:', existingIntent.id)
        
        return new Response(
          JSON.stringify({
            success: true,
            client_secret: existingIntent.client_secret,
            payment_intent_id: existingIntent.id
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      } catch (retrieveError) {
        console.error('Error retrieving existing payment intent:', retrieveError)
        // Continue to create a new one if retrieval fails
      }
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      description: description,
      metadata: {
        booking_id: bookingId,
        venue_id: venue_id,
        environment: environment
      }
    })

    console.log('Payment intent created successfully:', paymentIntent.id);

    // Log successful key usage for audit purposes
    await supabase
      .from('stripe_key_audit')
      .insert([{
        venue_id: venue_id,
        user_id: null,
        action: 'payment_intent_created',
        environment: environment,
        key_type: 'secret',
        success: true,
        metadata: { 
          payment_intent_id: paymentIntent.id,
          booking_id: bookingId,
          amount: amount,
          currency: currency
        }
      }]);

    return new Response(
      JSON.stringify({
        success: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Create payment intent error:', error)
    
    // Log failed attempt for audit purposes
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )
    
    try {
      await supabase
        .from('stripe_key_audit')
        .insert([{
          venue_id: null,
          user_id: null,
          action: 'payment_intent_failed',
          environment: 'unknown',
          key_type: 'secret',
          success: false,
          error_message: error.message,
          metadata: { 
            error_type: error.constructor.name,
            error_details: error.toString()
          }
        }]);
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Payment intent creation failed',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
