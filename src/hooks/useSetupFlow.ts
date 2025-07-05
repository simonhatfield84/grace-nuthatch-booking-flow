
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  SetupStep, 
  AdminData, 
  VenueData, 
  SetupError,
  VenueSetupResult,
  convertToSetupError 
} from '@/types/setup';

export interface SetupState {
  step: SetupStep;
  adminData: AdminData;
  venueData: VenueData;
  loading: boolean;
  verifyLoading: boolean;
  resendLoading: boolean;
  error: string | null;
}

const initialAdminData: AdminData = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: ''
};

const initialVenueData: VenueData = {
  venueName: '',
  venueSlug: '',
  venueEmail: '',
  venuePhone: '',
  venueAddress: ''
};

export const useSetupFlow = () => {
  const [state, setState] = useState<SetupState>({
    step: 'admin',
    adminData: initialAdminData,
    venueData: initialVenueData,
    loading: false,
    verifyLoading: false,
    resendLoading: false,
    error: null
  });

  const { toast } = useToast();

  const showError = useCallback((error: SetupError | string) => {
    const message = typeof error === 'string' ? error : error.message;
    setState(prev => ({ ...prev, error: message }));
    toast({
      title: "Setup Error",
      description: message,
      variant: "destructive"
    });
  }, [toast]);

  const showSuccess = useCallback((message: string) => {
    setState(prev => ({ ...prev, error: null }));
    toast({
      title: "Success",
      description: message,
    });
  }, [toast]);

  const updateState = useCallback((updates: Partial<SetupState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateAdminData = useCallback((field: keyof AdminData, value: string) => {
    setState(prev => ({
      ...prev,
      adminData: { ...prev.adminData, [field]: value }
    }));
  }, []);

  const updateVenueData = useCallback((field: keyof VenueData, value: string) => {
    setState(prev => {
      const newVenueData = { ...prev.venueData, [field]: value };
      
      // Auto-generate slug from venue name
      if (field === 'venueName') {
        const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        newVenueData.venueSlug = slug;
      }
      
      return { ...prev, venueData: newVenueData };
    });
  }, []);

  const validateAdminForm = useCallback((): boolean => {
    if (state.adminData.password !== state.adminData.confirmPassword) {
      showError("Passwords do not match. Please check and try again.");
      return false;
    }

    if (state.adminData.password.length < 6) {
      showError("Password must be at least 6 characters long.");
      return false;
    }

    return true;
  }, [state.adminData, showError]);

  const sendVerificationCode = useCallback(async (email: string, firstName?: string) => {
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
  }, []);

  const createAdminAccount = useCallback(async () => {
    if (!validateAdminForm()) return false;

    updateState({ loading: true, error: null });

    try {
      // Create the user account first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: state.adminData.email,
        password: state.adminData.password,
        options: {
          data: {
            first_name: state.adminData.firstName,
            last_name: state.adminData.lastName
          }
        }
      });

      if (authError) {
        const setupError = convertToSetupError(authError);
        
        if (setupError.message.includes('User already registered')) {
          showError("An account with this email already exists. Please sign in instead.");
          return false;
        }
        throw setupError;
      }

      // Send verification code
      await sendVerificationCode(state.adminData.email, state.adminData.firstName);
      
      showSuccess(`Verification code sent to ${state.adminData.email}`);
      updateState({ step: 'code-verification' });

      return true;
    } catch (error) {
      const setupError = convertToSetupError(error);
      
      if (setupError.code === 'over_email_send_rate_limit') {
        showError("Email rate limit exceeded. Please wait before trying again.");
      } else {
        showError("Failed to create account: " + setupError.message);
      }
      return false;
    } finally {
      updateState({ loading: false });
    }
  }, [state.adminData, validateAdminForm, showError, showSuccess, updateState, sendVerificationCode]);

  const verifyCode = useCallback(async (code: string): Promise<boolean> => {
    updateState({ verifyLoading: true, error: null });
    
    try {
      const { data: isValid, error } = await supabase.rpc('verify_code', {
        user_email: state.adminData.email,
        submitted_code: code
      });

      if (error) throw error;

      if (isValid) {
        showSuccess("Email verified successfully!");
        updateState({ step: 'venue' });
        return true;
      } else {
        showError("Invalid or expired code. Please try again.");
        return false;
      }
    } catch (error) {
      const setupError = convertToSetupError(error);
      showError("Verification failed: " + setupError.message);
      return false;
    } finally {
      updateState({ verifyLoading: false });
    }
  }, [state.adminData.email, showError, showSuccess, updateState]);

  const resendVerificationCode = useCallback(async () => {
    updateState({ resendLoading: true, error: null });
    
    try {
      await sendVerificationCode(state.adminData.email, state.adminData.firstName);
      showSuccess("New verification code sent!");
    } catch (error) {
      const setupError = convertToSetupError(error);
      showError("Failed to resend code: " + setupError.message);
    } finally {
      updateState({ resendLoading: false });
    }
  }, [state.adminData.email, state.adminData.firstName, showError, showSuccess, updateState, sendVerificationCode]);

  const createVenue = useCallback(async (): Promise<boolean> => {
    updateState({ loading: true, error: null });

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('No authenticated user found');
      }

      // Use the atomic venue setup function
      const { data: result, error: setupError } = await supabase.rpc('setup_venue_atomic', {
        p_user_id: user.id,
        p_email: state.adminData.email,
        p_first_name: state.adminData.firstName,
        p_last_name: state.adminData.lastName,
        p_venue_name: state.venueData.venueName,
        p_venue_slug: state.venueData.venueSlug,
        p_venue_email: state.venueData.venueEmail,
        p_venue_phone: state.venueData.venuePhone,
        p_venue_address: state.venueData.venueAddress
      });

      if (setupError) throw setupError;

      // Type assertion for the result - convert through unknown first
      const venueResult = result as unknown as VenueSetupResult;

      if (venueResult?.success) {
        showSuccess("Venue created successfully!");
        updateState({ step: 'complete' });
        return true;
      } else {
        throw new Error(venueResult?.error || 'Venue setup failed');
      }
    } catch (error) {
      const setupError = convertToSetupError(error);
      showError("Failed to create venue: " + setupError.message);
      return false;
    } finally {
      updateState({ loading: false });
    }
  }, [state.adminData, state.venueData, showError, showSuccess, updateState]);

  return {
    state,
    updateState,
    updateAdminData,
    updateVenueData,
    createAdminAccount,
    verifyCode,
    resendVerificationCode,
    createVenue,
    showError,
    showSuccess
  };
};
