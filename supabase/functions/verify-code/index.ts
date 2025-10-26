import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createErrorResponse } from '../_shared/errorSanitizer.ts';
import { rateLimit, getRateLimitKey } from '../_shared/rateLimit.ts';

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { email, code } = await req.json();

    // Validation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ code: 'invalid_email', message: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    if (!code || typeof code !== 'string' || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ code: 'invalid_code_format', message: 'Code must be 6 digits' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Rate limiting: 3 attempts per email per 15 minutes
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = getRateLimitKey(`${email.toLowerCase()}:${ip}`, 'verify');
    
    const allowed = await rateLimit(rateLimitKey, 3, 15 * 60);
    if (!allowed) {
      return new Response(
        JSON.stringify({ 
          code: 'rate_limited', 
          message: 'Too many attempts. Please try again in 15 minutes.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Initialize Supabase with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Look up active, unused code
    const { data: codeRecord, error: fetchError } = await supabase
      .from('email_verification_codes')
      .select('id, email, code, expires_at, used_at, attempts')
      .eq('email', email.toLowerCase())
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;

    // Check if code exists and matches
    if (!codeRecord) {
      return new Response(
        JSON.stringify({ 
          code: 'invalid_code', 
          message: 'Invalid or expired verification code.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Verify code matches
    if (codeRecord.code !== code) {
      // Increment attempts
      await supabase
        .from('email_verification_codes')
        .update({ attempts: (codeRecord.attempts || 0) + 1 })
        .eq('id', codeRecord.id);

      return new Response(
        JSON.stringify({ 
          code: 'invalid_code', 
          message: 'Invalid verification code.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Mark code as used
    const { error: updateError } = await supabase
      .from('email_verification_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', codeRecord.id);

    if (updateError) throw updateError;

    console.log(`[verify-code] Code verified successfully for ${email}`);

    // Success
    return new Response(
      JSON.stringify({ 
        success: true,
        email: codeRecord.email 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error) {
    console.error('[verify-code] Error:', error);
    return createErrorResponse(error, 500, corsHeaders);
  }
};

serve(handler);
