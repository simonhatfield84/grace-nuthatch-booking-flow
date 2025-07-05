
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getFirstValidationError } from '@/services/validationService';
import { 
  createUserAccount, 
  sendVerificationCode, 
  verifyEmailCode, 
  setupVenue 
} from '@/services/setupService';
import { convertToSetupError } from '@/types/setup';
import { useSetupState } from './useSetupState';

export const useSetupActions = () => {
  const { 
    state, 
    setError, 
    setLoading, 
    setVerifyLoading, 
    setResendLoading, 
    setStep 
  } = useSetupState();
  
  const { toast } = useToast();

  const showError = useCallback((error: string) => {
    setError(error);
    toast({
      title: "Setup Error",
      description: error,
      variant: "destructive"
    });
  }, [toast, setError]);

  const showSuccess = useCallback((message: string) => {
    setError(null);
    toast({
      title: "Success",
      description: message,
    });
  }, [toast, setError]);

  const createAdminAccount = useCallback(async (): Promise<boolean> => {
    const validationError = getFirstValidationError(state.adminData);
    if (validationError) {
      showError(validationError);
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      await createUserAccount(state.adminData);
      await sendVerificationCode(state.adminData.email, state.adminData.firstName);
      
      showSuccess(`Verification code sent to ${state.adminData.email}`);
      setStep('code-verification');
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
      setLoading(false);
    }
  }, [state.adminData, showError, showSuccess, setLoading, setError, setStep]);

  const verifyCode = useCallback(async (code: string): Promise<boolean> => {
    setVerifyLoading(true);
    setError(null);
    
    try {
      const isValid = await verifyEmailCode(state.adminData.email, code);

      if (isValid) {
        showSuccess("Email verified successfully!");
        setStep('venue');
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
      setVerifyLoading(false);
    }
  }, [state.adminData.email, showError, showSuccess, setVerifyLoading, setError, setStep]);

  const resendVerificationCode = useCallback(async () => {
    setResendLoading(true);
    setError(null);
    
    try {
      await sendVerificationCode(state.adminData.email, state.adminData.firstName);
      showSuccess("New verification code sent!");
    } catch (error) {
      const setupError = convertToSetupError(error);
      showError("Failed to resend code: " + setupError.message);
    } finally {
      setResendLoading(false);
    }
  }, [state.adminData.email, state.adminData.firstName, showError, showSuccess, setResendLoading, setError]);

  const createVenue = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await setupVenue(state.adminData, state.venueData);
      showSuccess("Venue created successfully!");
      setStep('complete');
      return true;
    } catch (error) {
      const setupError = convertToSetupError(error);
      showError("Failed to create venue: " + setupError.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [state.adminData, state.venueData, showError, showSuccess, setLoading, setError, setStep]);

  return {
    createAdminAccount,
    verifyCode,
    resendVerificationCode,
    createVenue,
    showError,
    showSuccess
  };
};
