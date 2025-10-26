
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { ok, err, jsonResponse } from '../_shared/apiResponse.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VenueCreationRequest {
  venueName: string;
  venueSlug: string;
  venueEmail: string;
  venuePhone: string;
  venueAddress: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
}

// Rate limiting map (in production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Security validation functions
const validateInput = (data: VenueCreationRequest) => {
  const errors: string[] = [];
  
  // Validate venue name
  if (data.venueName.length < 2 || data.venueName.length > 100) {
    errors.push('Venue name must be between 2 and 100 characters');
  }
  
  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(data.venueSlug)) {
    errors.push('Venue slug must contain only lowercase letters, numbers, and hyphens');
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.venueEmail) || !emailRegex.test(data.adminEmail)) {
    errors.push('Invalid email format');
  }
  
  // Validate names
  if (data.adminFirstName.length < 1 || data.adminLastName.length < 1) {
    errors.push('Admin first and last names are required');
  }
  
  return errors;
};

const checkRateLimit = (identifier: string): boolean => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 3;
  
  const current = rateLimitMap.get(identifier);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxAttempts) {
    return false;
  }
  
  current.count++;
  return true;
};

const logSecurityEvent = async (supabase: any, eventType: string, details: any, userAgent?: string, ipAddress?: string) => {
  try {
    await supabase.from('security_audit').insert({
      event_type: eventType,
      event_details: details,
      user_agent: userAgent,
      ip_address: ipAddress,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

interface VenueSetupResponse {
  success: boolean;
  venue?: any;
  error?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Enhanced CORS headers with additional security
  const secureHeaders = {
    ...corsHeaders,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: secureHeaders });
  }

  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || '';

  try {
    console.log('Create venue admin function called');

    // Rate limiting check
    if (!checkRateLimit(clientIP)) {
      await logSecurityEvent(null, 'venue_creation_rate_limit_exceeded', {
        ip_address: clientIP,
        user_agent: userAgent,
        blocked_at: new Date().toISOString()
      });
      
      return jsonResponse(
        err('rate_limited', 'Too many requests. Please try again later.'),
        429,
        secureHeaders
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the request is from a platform admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      await logSecurityEvent(supabaseAdmin, 'venue_creation_no_auth', {
        ip_address: clientIP,
        user_agent: userAgent
      });
      throw new Error('Authorization header missing');
    }

    // Verify platform admin status
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      await logSecurityEvent(supabaseAdmin, 'venue_creation_invalid_auth', {
        ip_address: clientIP,
        user_agent: userAgent,
        error: authError?.message
      });
      throw new Error('Invalid authentication');
    }

    // Check if user is a platform admin
    const { data: adminCheck, error: adminError } = await supabaseAdmin
      .from('platform_admins')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminCheck) {
      await logSecurityEvent(supabaseAdmin, 'venue_creation_unauthorized', {
        user_id: user.id,
        ip_address: clientIP,
        user_agent: userAgent
      });
      throw new Error('Unauthorized: Platform admin access required');
    }

    // Parse request body
    const requestData: VenueCreationRequest = await req.json();
    console.log('Creating venue with data:', requestData);

    // Enhanced input validation
    const validationErrors = validateInput(requestData);
    if (validationErrors.length > 0) {
      await logSecurityEvent(supabaseAdmin, 'venue_creation_validation_failed', {
        user_id: user.id,
        validation_errors: validationErrors,
        ip_address: clientIP,
        user_agent: userAgent
      });
      
      return jsonResponse(
        err('invalid_input', `Validation failed: ${validationErrors.join(', ')}`),
        400,
        secureHeaders
      );
    }

    // Check for duplicate venue slug
    const { data: existingVenue } = await supabaseAdmin
      .from('venues')
      .select('id')
      .eq('slug', requestData.venueSlug)
      .single();

    if (existingVenue) {
      await logSecurityEvent(supabaseAdmin, 'venue_creation_duplicate_slug', {
        user_id: user.id,
        attempted_slug: requestData.venueSlug,
        ip_address: clientIP,
        user_agent: userAgent
      });
      
      return jsonResponse(
        err('duplicate_entry', 'A venue with this slug already exists'),
        400,
        secureHeaders
      );
    }

    // Validate required fields
    const requiredFields = ['venueName', 'venueSlug', 'venueEmail', 'adminFirstName', 'adminLastName', 'adminEmail'];
    const missingFields = requiredFields.filter(field => !requestData[field as keyof VenueCreationRequest]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Generate a secure temporary password
    const tempPassword = 'Grace' + Math.random().toString(36).slice(-8) + '!' + Math.floor(Math.random() * 100);

    // Create the admin user account
    const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email: requestData.adminEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: requestData.adminFirstName,
        last_name: requestData.adminLastName,
      }
    });

    if (authCreateError) {
      console.error('Auth creation error:', authCreateError);
      await logSecurityEvent(supabaseAdmin, 'venue_creation_auth_failed', {
        user_id: user.id,
        error: authCreateError.message,
        admin_email: requestData.adminEmail,
        ip_address: clientIP,
        user_agent: userAgent
      });
      throw new Error(`Failed to create user account: ${authCreateError.message}`);
    }

    if (!authData.user) {
      throw new Error('Failed to create user account');
    }

    console.log('User created:', authData.user.id);

    // Use the database function to create venue and profile atomically
    const { data: venueResult, error: venueError } = await supabaseAdmin.rpc('setup_venue_atomic', {
      p_user_id: authData.user.id,
      p_email: requestData.adminEmail,
      p_first_name: requestData.adminFirstName,
      p_last_name: requestData.adminLastName,
      p_venue_name: requestData.venueName,
      p_venue_slug: requestData.venueSlug,
      p_venue_email: requestData.venueEmail,
      p_venue_phone: requestData.venuePhone,
      p_venue_address: requestData.venueAddress,
    });

    if (venueError) {
      console.error('Venue creation error:', venueError);
      
      // Clean up the created user if venue creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      await logSecurityEvent(supabaseAdmin, 'venue_creation_setup_failed', {
        user_id: user.id,
        created_user_id: authData.user.id,
        error: venueError.message,
        ip_address: clientIP,
        user_agent: userAgent
      });
      
      throw new Error(`Failed to create venue: ${venueError.message}`);
    }

    // Safe type casting: first to unknown, then to our interface
    const response = venueResult as unknown as VenueSetupResponse;

    if (!response?.success) {
      // Clean up the created user if venue setup fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(response?.error || 'Failed to create venue');
    }

    console.log('Venue created successfully:', response);

    // Log successful venue creation
    await logSecurityEvent(supabaseAdmin, 'venue_creation_successful', {
      created_by: user.id,
      venue_id: response.venue?.id,
      venue_slug: requestData.venueSlug,
      admin_user_id: authData.user.id,
      ip_address: clientIP,
      user_agent: userAgent
    });

    // Return success response with temporary password info
    return jsonResponse(
      ok({
        venue: response.venue,
        tempPassword: tempPassword,
        message: `Venue created successfully. Admin can log in with email ${requestData.adminEmail} and temporary password.`
      }),
      200,
      secureHeaders
    );

  } catch (error: any) {
    console.error('Error in create-venue-admin function:', error);
    
    return jsonResponse(
      err('server_error', error.message || 'An unexpected error occurred'),
      500,
      secureHeaders
    );
  }
};

serve(handler);
