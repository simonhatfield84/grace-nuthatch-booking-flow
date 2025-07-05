
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://supabase.co/dist/module/index.js";

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

interface VenueSetupResponse {
  success: boolean;
  venue?: any;
  error?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Create venue admin function called');

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
      throw new Error('Authorization header missing');
    }

    // Verify platform admin status
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
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
      throw new Error('Unauthorized: Platform admin access required');
    }

    // Parse request body
    const requestData: VenueCreationRequest = await req.json();
    console.log('Creating venue with data:', requestData);

    // Validate required fields
    const requiredFields = ['venueName', 'venueSlug', 'venueEmail', 'adminFirstName', 'adminLastName', 'adminEmail'];
    const missingFields = requiredFields.filter(field => !requestData[field as keyof VenueCreationRequest]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Generate a secure temporary password
    const tempPassword = 'Grace' + Math.random().toString(36).slice(-8) + '!';

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

    // Return success response with temporary password info
    return new Response(JSON.stringify({
      success: true,
      venue: response.venue,
      tempPassword: tempPassword,
      message: `Venue created successfully. Admin can log in with email ${requestData.adminEmail} and temporary password.`
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in create-venue-admin function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
};

serve(handler);
