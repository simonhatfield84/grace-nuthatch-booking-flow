
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
import { SetupState } from './useSetupState';

interface UseSetupActionsProps {
  state: SetupState;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  setVerifyLoading: (verifyLoading: boolean) => void;
  setResendLoading: (resendLoading: boolean) => void;
  setStep: (step: 'admin' | 'code-verification' | 'venue' | 'complete') => void;
  setApprovalEmailStatus: (approvalEmailSent: boolean, approvalEmailError: string | null) => void;
  setVenueId: (venueId: string | null) => void;
}

export const useSetupActions = ({
  state,
  setError,
  setLoading,
  setVerifyLoading,
  setResendLoading,
  setStep,
  setApprovalEmailStatus,
  setVenueId
}: UseSetupActionsProps) => {
  const { toast } = useToast();

  const showError = useCallback((error: string) => {
    console.log('🚨 [useSetupActions] showError called with:', error);
    setError(error);
    toast({
      title: "Setup Error",
      description: error,
      variant: "destructive"
    });
  }, [toast, setError]);

  const showSuccess = useCallback((message: string) => {
    console.log('✅ [useSetupActions] showSuccess called with:', message);
    setError(null);
    toast({
      title: "Success",
      description: message,
    });
  }, [toast, setError]);

  const createAdminAccount = useCallback(async (): Promise<boolean> => {
    console.log('🚀 [useSetupActions] createAdminAccount started');
    console.log('📝 [useSetupActions] Admin data:', state.adminData);
    
    try {
      // Validation check with detailed logging
      console.log('🔍 [useSetupActions] Checking validation...');
      const validationError = getFirstValidationError(state.adminData);
      if (validationError) {
        console.error('❌ [useSetupActions] Validation failed:', validationError);
        showError(validationError);
        return false;
      }
      console.log('✅ [useSetupActions] Validation passed');

      // Set loading state
      console.log('⏳ [useSetupActions] Setting loading state...');
      setLoading(true);
      setError(null);

      // Create user account
      console.log('👤 [useSetupActions] Creating user account...');
      await createUserAccount(state.adminData);
      console.log('✅ [useSetupActions] User account created successfully');
      
      // Send verification code
      console.log('📧 [useSetupActions] Sending verification code...');
      await sendVerificationCode(state.adminData.email, state.adminData.firstName);
      console.log('✅ [useSetupActions] Verification code sent successfully');
      
      showSuccess(`Verification code sent to ${state.adminData.email}`);
      setStep('code-verification');
      console.log('🎯 [useSetupActions] Moved to code-verification step');
      return true;
      
    } catch (error) {
      console.error('💥 [useSetupActions] Error in createAdminAccount:', error);
      const setupError = convertToSetupError(error);
      console.error('📋 [useSetupActions] Converted error:', setupError);
      
      if (setupError.code === 'over_email_send_rate_limit') {
        showError("Email rate limit exceeded. Please wait before trying again.");
      } else if (setupError.message.includes('User already registered')) {
        showError("An account with this email already exists. Please use a different email or sign in instead.");
      } else {
        showError("Failed to create account: " + setupError.message);
      }
      return false;
    } finally {
      console.log('🏁 [useSetupActions] Setting loading to false');
      setLoading(false);
    }
  }, [state.adminData, showError, showSuccess, setLoading, setError, setStep]);

  const verifyCode = useCallback(async (code: string): Promise<boolean> => {
    console.log('🔐 [useSetupActions] Starting code verification for:', state.adminData.email);
    setVerifyLoading(true);
    setError(null);
    
    try {
      const isValid = await verifyEmailCode(state.adminData.email, code);
      console.log('📋 [useSetupActions] Code verification result:', isValid);

      if (isValid) {
        showSuccess("Email verified successfully!");
        setStep('venue');
        return true;
      } else {
        showError("Invalid or expired code. Please try again.");
        return false;
      }
    } catch (error) {
      console.error('💥 [useSetupActions] Code verification error:', error);
      const setupError = convertToSetupError(error);
      showError("Verification failed: " + setupError.message);
      return false;
    } finally {
      setVerifyLoading(false);
    }
  }, [state.adminData.email, showError, showSuccess, setVerifyLoading, setError, setStep]);

  const resendVerificationCode = useCallback(async () => {
    console.log('🔄 [useSetupActions] Resending verification code to:', state.adminData.email);
    setResendLoading(true);
    setError(null);
    
    try {
      await sendVerificationCode(state.adminData.email, state.adminData.firstName);
      showSuccess("New verification code sent!");
    } catch (error) {
      console.error('💥 [useSetupActions] Resend code error:', error);
      const setupError = convertToSetupError(error);
      showError("Failed to resend code: " + setupError.message);
    } finally {
      setResendLoading(false);
    }
  }, [state.adminData.email, state.adminData.firstName, showError, showSuccess, setResendLoading, setError]);

  const createVenue = useCallback(async (): Promise<boolean> => {
    console.log('🏢 [useSetupActions] Starting venue creation...');
    setLoading(true);
    setError(null);

    try {
      console.log('[useSetupActions] Creating venue and sending approval request...');
      const result = await setupVenue(state.adminData, state.venueData);
      console.log('📋 [useSetupActions] Venue creation result:', result);
      
      setVenueId(result.venue?.id || null);
      setApprovalEmailStatus(result.approvalEmailSent, result.approvalEmailError);
      
      showSuccess("Venue created successfully!");
      setStep('complete');
      return true;
    } catch (error) {
      console.error('💥 [useSetupActions] Venue creation error:', error);
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

    console.log('📧 [useSetupActions] Resending approval request for venue:', state.venueId);
    setLoading(true);
    setError(null);

    try {
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
      console.error('💥 [useSetupActions] Approval request error:', error);
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
