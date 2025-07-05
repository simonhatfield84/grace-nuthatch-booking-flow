
import { useState, useCallback } from 'react';
import { SetupStep, AdminData, VenueData } from '@/types/setup';
import { INITIAL_ADMIN_DATA, INITIAL_VENUE_DATA } from '@/utils/setupConstants';
import { generateSlugFromName } from '@/utils/setupHelpers';

export interface SetupState {
  step: SetupStep;
  adminData: AdminData;
  venueData: VenueData;
  loading: boolean;
  verifyLoading: boolean;
  resendLoading: boolean;
  error: string | null;
  approvalEmailSent: boolean;
  approvalEmailError: string | null;
  venueId: string | null;
}

export const useSetupState = () => {
  const [state, setState] = useState<SetupState>({
    step: 'admin',
    adminData: INITIAL_ADMIN_DATA,
    venueData: INITIAL_VENUE_DATA,
    loading: false,
    verifyLoading: false,
    resendLoading: false,
    error: null,
    approvalEmailSent: false,
    approvalEmailError: null,
    venueId: null
  });

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
        const slug = generateSlugFromName(value);
        newVenueData.venueSlug = slug;
      }
      
      return { ...prev, venueData: newVenueData };
    });
  }, []);

  const setStep = useCallback((step: SetupStep) => {
    setState(prev => ({ ...prev, step }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setVerifyLoading = useCallback((verifyLoading: boolean) => {
    setState(prev => ({ ...prev, verifyLoading }));
  }, []);

  const setResendLoading = useCallback((resendLoading: boolean) => {
    setState(prev => ({ ...prev, resendLoading }));
  }, []);

  const setApprovalEmailStatus = useCallback((approvalEmailSent: boolean, approvalEmailError: string | null) => {
    setState(prev => ({ ...prev, approvalEmailSent, approvalEmailError }));
  }, []);

  const setVenueId = useCallback((venueId: string | null) => {
    setState(prev => ({ ...prev, venueId }));
  }, []);

  return {
    state,
    updateState,
    updateAdminData,
    updateVenueData,
    setStep,
    setError,
    setLoading,
    setVerifyLoading,
    setResendLoading,
    setApprovalEmailStatus,
    setVenueId
  };
};
