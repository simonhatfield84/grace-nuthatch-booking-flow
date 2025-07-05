
import { supabase } from '@/integrations/supabase/client';
import { AdminData, VenueData, VenueSetupResult, convertToSetupError } from '@/types/setup';

export const sendVerificationCode = async (email: string, firstName?: string): Promise<string> => {
  // Generate and store verification code
  const { data: codeData, error: codeError } = await supabase.rpc('create_verification_code', {
    user_email: email
  });

  if (codeError) throw codeError;

  // Send code via email
  const { error: emailError } = await supabase.functions.invoke('send-verification-code', {
    body: {
      email: email,
      code: codeData,
      firstName: firstName
    }
  });

  if (emailError) throw emailError;

  return codeData;
};

export const createUserAccount = async (adminData: AdminData): Promise<void> => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: adminData.email,
    password: adminData.password,
    options: {
      data: {
        first_name: adminData.firstName,
        last_name: adminData.lastName
      }
    }
  });

  if (authError) {
    const setupError = convertToSetupError(authError);
    
    if (setupError.message.includes('User already registered')) {
      throw new Error("An account with this email already exists. Please sign in instead.");
    }
    throw setupError;
  }
};

export const verifyEmailCode = async (email: string, code: string): Promise<boolean> => {
  const { data: isValid, error } = await supabase.rpc('verify_code', {
    user_email: email,
    submitted_code: code
  });

  if (error) throw error;
  return isValid;
};

export const setupVenue = async (adminData: AdminData, venueData: VenueData): Promise<VenueSetupResult> => {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('No authenticated user found');
  }

  // Use the atomic venue setup function
  const { data: result, error: setupError } = await supabase.rpc('setup_venue_atomic', {
    p_user_id: user.id,
    p_email: adminData.email,
    p_first_name: adminData.firstName,
    p_last_name: adminData.lastName,
    p_venue_name: venueData.venueName,
    p_venue_slug: venueData.venueSlug,
    p_venue_email: venueData.venueEmail,
    p_venue_phone: venueData.venuePhone,
    p_venue_address: venueData.venueAddress
  });

  if (setupError) throw setupError;

  // Type assertion for the result - convert through unknown first
  const venueResult = result as unknown as VenueSetupResult;

  if (!venueResult?.success) {
    throw new Error(venueResult?.error || 'Venue setup failed');
  }

  return venueResult;
};
