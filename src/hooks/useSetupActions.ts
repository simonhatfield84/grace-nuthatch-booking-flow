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
    console.log('🚀 createAdminAccount started');
    console.log('📝 Admin data:', state.adminData);
    
    try {
      // Validation check with detailed logging
      console.log('🔍 Checking validation...');
      const validationError = getFirstValidationError(state.adminData);
      if (validationError) {
        console.error('❌ Validation failed:', validationError);
        showError(validationError);
        return false;
      }
      console.log('✅ Validation passed');

      // Set loading state
      console.log('⏳ Setting loading state...');
      setLoading(true);
      setError(null);

      // Create user account
      console.log('👤 Creating user account...');
      await createUserAccount(state.adminData);
      console.log('✅ User account created successfully');
      
      // Send verification code
      console.log('📧 Sending verification code...');
      await sendVerificationCode(state.adminData.email, state.adminData.firstName);
      console.log('✅ Verification code sent successfully');
      
      showSuccess(`Verification code sent to ${state.adminData.email}`);
      setStep('code-verification');
      console.log('🎯 Moved to code-verification step');
      return true;
      
    } catch (error) {
      console.error('💥 Error in createAdminAccount:', error);
      const setupError = convertToSetupError(error);
      console.error('📋 Converted error:', setupError);
      
      if (setupError.code === 'over_email_send_rate_limit') {
        showError("Email rate limit exceeded. Please wait before trying again.");
      } else if (setupError.message.includes('User already registered')) {
        showError("An account with this email already exists. Please use a different email or sign in instead.");
      } else {
        showError("Failed to create account: " + setupError.message);
      }
      return false;
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  }, [state.adminData, showError, showSuccess, setLoading, setError, setStep]);

  const verifyCode = useCallback(async (code: string): Promise<boolean> => {
    console.log('🔐 Starting code verification for:', state.adminData.email);
    setVerifyLoading(true);
    setError(null);
    
    try {
      const isValid = await verifyEmailCode(state.adminData.email, code);
      console.log('📋 Code verification result:', isValid);

      if (isValid) {
        showSuccess("Email verified successfully!");
        setStep('venue');
        return true;
      } else {
        showError("Invalid or expired code. Please try again.");
        return false;
      }
    } catch (error) {
      console.error('💥 Code verification error:', error);
      const setupError = convertToSetupError(error);
      showError("Verification failed: " + setupError.message);
      return false;
    } finally {
      setVerifyLoading(false);
    }
  }, [state.adminData.email, showError, showSuccess, setVerifyLoading, setError, setStep]);

  const resendVerificationCode = useCallback(async () => {
    console.log('🔄 Resending verification code to:', state.adminData.email);
    setResendLoading(true);
    setError(null);
    
    try {
      await sendVerificationCode(state.adminData.email, state.adminData.firstName);
      showSuccess("New verification code sent!");
    } catch (error) {
      console.error('💥 Resend code error:', error);
      const setupError = convertToSetupError(error);
      showError("Failed to resend code: " + setupError.message);
    } finally {
      setResendLoading(false);
    }
  }, [state.adminData.email, state.adminData.firstName, showError, showSuccess, setResendLoading, setError]);

  const createVenue = useCallback(async (): Promise<boolean> => {
    console.log('🏢 Starting venue creation...');
    setLoading(true);
    setError(null);

    try {
      console.log('Creating venue and sending approval request...');
      const result = await setupVenue(state.adminData, state.venueData);
      console.log('📋 Venue creation result:', result);
      
      // Store venue ID and approval status
      setVenueId(result.venue?.id || null);
      setApprovalEmailStatus(result.approvalEmailSent, result.approvalEmailError);
      
      showSuccess("Venue created successfully!");
      setStep('complete');
      return true;
    } catch (error) {
      console.error('💥 Venue creation error:', error);
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

    console.log('📧 Resending approval request for venue:', state.venueId);
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
      console.error('💥 Approval request error:', error);
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
