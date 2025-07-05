
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  SetupStep, 
  AdminData, 
  VenueData, 
  SetupError,
  convertToSetupError 
} from '@/types/setup';

export interface SetupState {
  step: SetupStep;
  adminData: AdminData;
  venueData: VenueData;
  loading: boolean;
  resendLoading: boolean;
  approvalEmailSent: boolean;
  approvalEmailError: string | null;
  isUserActive: boolean;
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
    resendLoading: false,
    approvalEmailSent: false,
    approvalEmailError: null,
    isUserActive: false
  });

  const { toast } = useToast();

  const showError = useCallback((error: SetupError | string) => {
    const message = typeof error === 'string' ? error : error.message;
    toast({
      title: "Setup Error",
      description: message,
      variant: "destructive"
    });
  }, [toast]);

  const showSuccess = useCallback((message: string) => {
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

  const createAdminAccount = useCallback(async () => {
    if (!validateAdminForm()) return false;

    updateState({ loading: true });

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: state.adminData.email,
        password: state.adminData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/setup`,
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

      // Check if email confirmation is required
      if (authData.user && !authData.user.email_confirmed_at) {
        showSuccess("We've sent you a verification email. Please check your inbox to continue.");
        updateState({ step: 'email-verification' });
      } else {
        updateState({ step: 'venue' });
      }

      return true;
    } catch (error) {
      const setupError = convertToSetupError(error);
      
      if (setupError.code === 'over_email_send_rate_limit') {
        showError("Email rate limit exceeded. Please wait an hour before trying again.");
      } else {
        showError("Failed to create admin account: " + setupError.message);
      }
      return false;
    } finally {
      updateState({ loading: false });
    }
  }, [state.adminData, validateAdminForm, showError, showSuccess, updateState]);

  const resendVerification = useCallback(async () => {
    updateState({ resendLoading: true });
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: state.adminData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/setup`
        }
      });

      if (error) throw error;

      showSuccess("Verification email has been resent. Please check your inbox.");
    } catch (error) {
      const setupError = convertToSetupError(error);
      
      if (setupError.code === 'over_email_send_rate_limit') {
        showError("Please wait before requesting another verification email.");
      } else {
        showError("Failed to resend verification email: " + setupError.message);
      }
    } finally {
      updateState({ resendLoading: false });
    }
  }, [state.adminData.email, showError, showSuccess, updateState]);

  return {
    state,
    updateState,
    updateAdminData,
    updateVenueData,
    createAdminAccount,
    resendVerification,
    showError,
    showSuccess
  };
};
