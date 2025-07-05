
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getFirstValidationError } from '@/services/validationService';
import { 
  createUserAccount, 
  sendVerificationCode, 
  verifyEmailCode, 
  setupVenue,
  sendApprovalRequest
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
    setStep,
    setApprovalEmailStatus,
    setVenueId
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
      console.log('Creating venue and sending approval request...');
      const result = await setupVenue(state.adminData, state.venueData);
      
      // Store venue ID and approval status
      setVenueId(result.venue?.id || null);
      setApprovalEmailStatus(result.approvalEmailSent, result.approvalEmailError);
      
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
  }, [state.adminData, state.venueData, showError, showSuccess, setLoading, setError, setStep, setApprovalEmailStatus, setVenueId]);

  const resendApprovalRequest = useCallback(async (): Promise<boolean> => {
    if (!state.venueId) {
      showError("No venue ID found. Cannot resend approval request.");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Resending approval request for venue:', state.venueId);
      await sendApprovalRequest(
        state.venueId,
        state.venueData.venueName,
        `${state.adminData.firstName} ${state.adminData.lastName}`,
        state.adminData.email
      );
      
      setApprovalEmailStatus(true, null);
      showSuccess("Approval request sent successfully!");
      return true;
    } catch (error) {
      const setupError = convertToSetupError(error);
      const errorMessage = "Failed to send approval request: " + setupError.message;
      setApprovalEmailStatus(false, errorMessage);
      showError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [state.venueId, state.venueData.venueName, state.adminData, showError, showSuccess, setLoading, setError, setApprovalEmailStatus]);

  return {
    createAdminAccount,
    verifyCode,
    resendVerificationCode,
    createVenue,
    resendApprovalRequest,
    showError,
    showSuccess
  };
};
